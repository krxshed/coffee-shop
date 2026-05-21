/* ================= ДАННЫЕ ЗАГРУЖАЮТСЯ ИЗ API ================= */
let coffees = [];

/* ================= СОСТОЯНИЕ ================= */
let index = 0;
let selectedType = 'grain';
let selectedFilterIndex = 0;
let volume = 500; // теперь 500 г по умолчанию
const cartMap = new Map();
const favoritesSet = new Set();

const ARABICA_DISCOUNT = 0.25;
const PROMO_CODE = "можно зачет";
const PROMO_RATE = 0.15;
let promoApplied = false;

// Получаем статус авторизации из глобальной переменной, установленной в шаблоне
const isAuthenticated = window.userAuthenticated === true;

/* DOM-элементы */
const leftCup = document.getElementById('leftCup');
const rightCup = document.getElementById('rightCup');
const activeCup = document.getElementById('activeCup');
const coffeeName = document.getElementById('coffeeName');
const coffeeDesc = document.getElementById('coffeeDesc');
const priceWrapper = document.getElementById('priceWrapper');
const favCountNode = document.getElementById('favCount');
const cartCountNode = document.getElementById('cartCount');
const cartPriceNode = document.getElementById('cartPrice');

const productsGrid = document.getElementById('productsGrid');
const filtersRow = document.getElementById('filtersRow');
const filterIndicator = document.getElementById('filterIndicator');

const shopPage = document.getElementById('shopPage');
const favoritesPage = document.getElementById('favoritesPage');
const cartPage = document.getElementById('cartPage');
const checkoutPage = document.getElementById('checkoutPage');
const orderConfirmation = document.getElementById('orderConfirmation');
const promosPage = document.getElementById('promosPage');

const favoritesItemsNode = document.getElementById('favoritesItems');
const cartItemsNode = document.getElementById('cartItems');
const totalPriceNode = document.getElementById('totalPrice');
const favSummaryNode = document.getElementById('favSummary');

const promoInput = document.getElementById('promoInput');
const promoApplyBtn = document.getElementById('promoApplyBtn');
const promoMsg = document.getElementById('promoMsg');

const shopLink = document.getElementById('shopLink');
const cartLink = document.getElementById('cartLink');
const favoritesLink = document.getElementById('favoritesLink');
const promosLink = document.getElementById('promosLink');

const mainTitle = document.getElementById('mainTitle');

/* ================= ЗАГРУЗКА ДАННЫХ ================= */
async function loadData() {
    try {
        const response = await fetch('/api/products/');
        const products = await response.json();

        const coffeeMap = new Map();

        for (const p of products) {
            const coffeeName = p.coffee_type;
            const processing = p.processing;
            const roastLabel = p.roast_level;
            const roastDisplay = getRoastDisplay(roastLabel);
            const prod = {
                id: p.id,
                title: p.title,
                subtitle: p.subtitle,
                desc: p.desc,
                prices: p.prices,
                img: p.img,
                stock: p.stock
            };

            if (!coffeeMap.has(coffeeName)) {
                let smallCup = '';
                let bigCup = '';
                if (coffeeName === 'Arabica') {
                    smallCup = '/static/images/cup-arabica-small.png';
                    bigCup = '/static/images/cup-arabica-big.png';
                } else if (coffeeName === 'Robusta') {
                    smallCup = '/static/images/cup-robusta-small.png';
                    bigCup = '/static/images/cup-robusta-big.png';
                } else if (coffeeName === 'Liberica') {
                    smallCup = '/static/images/cup-liberica-small.png';
                    bigCup = '/static/images/cup-liberica-big.png';
                } else {
                    smallCup = '/static/images/cup-mix-small.png';
                    bigCup = '/static/images/cup-mix-big.png';
                }
                coffeeMap.set(coffeeName, {
                    name: coffeeName,
                    desc: getCoffeeDescription(coffeeName),
                    small: smallCup,
                    big: bigCup,
                    stock: p.stock,
                    types: {}
                });
            }
            const coffee = coffeeMap.get(coffeeName);
            if (!coffee.types[processing]) {
                coffee.types[processing] = { filters: [] };
            }
            const existingFilter = coffee.types[processing].filters.find(f => f.id === roastLabel);
            if (!existingFilter) {
                coffee.types[processing].filters.push({
                    id: roastLabel,
                    label: roastDisplay,
                    product: prod
                });
            } else {
                existingFilter.product = prod;
            }
        }

        coffees = Array.from(coffeeMap.values());
        // Если пользователь не авторизован, не загружаем корзину/избранное из localStorage
        if (isAuthenticated) {
            loadFromLocalStorage();
        } else {
            // Для гостя очищаем корзину и избранное
            cartMap.clear();
            favoritesSet.clear();
            updateCartUI();
            updateFavCountUI();
        }
        renderShop();
    } catch (err) {
        console.error("Ошибка загрузки данных:", err);
    }
}

function getCoffeeDescription(name) {
    if (name === 'Arabica') return "Король кофейного мира! Нежные цветочные и фруктовые ноты, бархатная текстура и изысканный аромат. Идеален для ценителей утонченного вкуса и долгого послевкусия.";
    if (name === 'Robusta') return "ЗАРЯД ЭНЕРГИИ! Мощный, насыщенный кофе с высокой крепостью и плотной пенкой. Идеален для любителей крепкого эспрессо и тех, кто ценит бодрящий эффект.";
    if (name === 'Liberica') return "ЭКСКЛЮЗИВ ДЛЯ ИСКАТЕЛЕЙ РЕДКОСТЕЙ! Уникальный кофе с дымными, тропическими и древесными нотами. Для тех, кто устал от обычного и хочет попробовать нечто особенное.";
    return "ИДЕАЛЬНЫЙ БАЛАНС ДЛЯ КАЖДОГО ДНЯ! Тщательно подобранный купаж, сочетающий лучшие качества разных сортов. Надежный выбор для тех, кто ценит стабильность и гармонию во вкусе.";
}

function getRoastDisplay(id) {
    const map = {
        'light': 'Светлая обжарка',
        'medium': 'Средняя обжарка',
        'dark': 'Темная обжарка',
        'coarse': 'Грубый помол',
        'fine': 'Тонкий помол',
        'freeze': 'Сублимированный',
        'powder': 'Порошковый',
        'extra': 'Экстра крепкий'
    };
    return map[id] || id;
}

/* ================= LOCALSTORAGE ================= */
function saveToLocalStorage() {
    if (!isAuthenticated) return;
    const cartData = Array.from(cartMap.entries());
    const favData = Array.from(favoritesSet);
    localStorage.setItem('cart', JSON.stringify(cartData));
    localStorage.setItem('favorites', JSON.stringify(favData));
}

function loadFromLocalStorage() {
    if (!isAuthenticated) return;
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        const parsed = JSON.parse(savedCart);
        cartMap.clear();
        for (const [key, value] of parsed) {
            cartMap.set(key, value);
        }
    }
    const savedFav = localStorage.getItem('favorites');
    if (savedFav) {
        const parsed = JSON.parse(savedFav);
        favoritesSet.clear();
        for (const item of parsed) {
            favoritesSet.add(item);
        }
    }
}

/* ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ================= */
function getCurrentProductInfo() {
    if (!coffees.length || index >= coffees.length) return null;
    const base = coffees[index];
    if (!base) return null;
    const typeGroup = base.types[selectedType];
    if (!typeGroup) return null;
    const filt = typeGroup.filters[selectedFilterIndex];
    if (!filt) return null;
    const prod = filt.product;
    return { base, filter: filt, product: prod };
}

function getPriceForVolume(prod, vol = null) {
    if (!prod || !prod.prices) return 0;
    const useVol = vol || volume;
    return prod.prices[useVol] || 0;
}

function getCartItemInfo(key) {
    const parts = key.split('__');
    if (parts.length < 4) return null;
    const coffeeName = parts[0];
    const type = parts[1];
    const filterId = parts[2];
    const vol = Number(parts[3]);

    const base = coffees.find(c => c.name === coffeeName);
    if (!base) return null;
    const typeGroup = base.types[type];
    if (!typeGroup) return null;
    const filt = typeGroup.filters.find(f => f.id === filterId);
    if (!filt) return null;
    const prod = filt.product;
    return { base, type, filter: filt, product: prod, volume: vol };
}

function isBigCup(prod, vol) {
    const volumes = Object.keys(prod.prices).map(Number);
    const maxVol = Math.max(...volumes);
    return vol >= maxVol;
}

/* ================= ОТРИСОВКА ================= */
function renderShop() {
    if (!coffees.length) return;
    const base = coffees[index];
    const prev = (index - 1 + coffees.length) % coffees.length;
    const next = (index + 1) % coffees.length;

    coffeeName.innerText = base.name;
    coffeeDesc.innerText = base.desc;

    activeCup.src = base.big;
    activeCup.style.width = "260px";
    leftCup.src = coffees[prev].small;
    rightCup.src = coffees[next].small;

    renderTypeButtons();
    renderFilters();
    renderProductsGrid();

    updateFavCountUI();
    updateCartUI();
    if (priceWrapper) priceWrapper.innerHTML = '';
}

function renderTypeButtons() {
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === selectedType);
    });
}

function renderFilters() {
    if (!coffees.length) return;
    const base = coffees[index];
    const typeGroup = base.types[selectedType];
    if (!typeGroup) return;
    filtersRow.querySelectorAll('.filter-btn').forEach(n => n.remove());
    const filters = typeGroup.filters;
    filters.forEach((f, i) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = f.label;
        btn.onclick = (e) => {
            selectedFilterIndex = i;
            moveFilterIndicator();
            renderProductsGrid();
            renderShop();
        };
        filtersRow.appendChild(btn);
    });
    setTimeout(moveFilterIndicator, 20);
}

function moveFilterIndicator() {
    const buttons = Array.from(filtersRow.querySelectorAll('.filter-btn'));
    if (buttons.length === 0) {
        if (filterIndicator) filterIndicator.style.display = 'none';
        return;
    }
    if (!filterIndicator) return;
    filterIndicator.style.display = 'block';
    const btn = buttons[selectedFilterIndex] || buttons[0];
    const left = btn.offsetLeft;
    const width = btn.offsetWidth;
    filterIndicator.style.transform = `translateX(${left}px)`;
    filterIndicator.style.width = `${width}px`;
    buttons.forEach((b, idx) => b.style.color = idx === selectedFilterIndex ? '#000' : '#333');
}

function renderProductsGrid() {
    productsGrid.innerHTML = '';
    const info = getCurrentProductInfo();
    if (!info) return;
    const prod = info.product;
    const base = info.base;

    const availableVolumes = Object.keys(prod.prices).map(Number).sort((a, b) => a - b);
    let cardSelectedVolume = availableVolumes.includes(Number(volume)) ? Number(volume) : availableVolumes[availableVolumes.length - 1];
    let cardQuantity = 1;

    const isCardCupBig = (v) => {
        const max = Math.max(...availableVolumes);
        return Number(v) >= max;
    };

    const initCupSrc = isCardCupBig(cardSelectedVolume) ? base.big : base.small;
    const initCupWidth = isCardCupBig(cardSelectedVolume) ? 120 : 80;

    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <h3>${prod.title}</h3>
        <div class="subtitle">${prod.subtitle || ''}</div>
        <img class="card-cup" id="cardCup" src="${initCupSrc}" alt="cup" style="width:${initCupWidth}px;">
        <img class="prod-img" src="${prod.img}" alt="${prod.title}" onerror="this.style.display='none'">
        <div class="desc">${prod.desc}</div>
        <div class="weight-options" id="weights-${info.base.name}"></div>
        <div style="display:flex; gap:12px; justify-content:center; align-items:center; margin-top:8px;">
            <div class="price-button" id="priceBtn">${getPriceForVolume(prod, cardSelectedVolume) * cardQuantity} ₽</div>
            <div class="fav-action" id="favAction">❤</div>
        </div>
        <div style="margin-top:8px; text-align:center;">
            <div class="quantity-selector">
                <button class="quantity-btn" id="qminus">-</button>
                <input class="quantity-input" id="qinputCard" type="number" min="1" value="${cardQuantity}">
                <button class="quantity-btn" id="qplus">+</button>
            </div>
        </div>
    `;
    productsGrid.appendChild(card);

    const weightsContainer = card.querySelector('.weight-options');
    const priceBtn = card.querySelector('#priceBtn');
    const cardCupImg = card.querySelector('#cardCup');
    const favAction = card.querySelector('#favAction');
    const qinputCard = card.querySelector('#qinputCard');
    const qminus = card.querySelector('#qminus');
    const qplus = card.querySelector('#qplus');

    const favKeyForCard = () => `${base.name}__${selectedType}__${info.filter.id}__${cardSelectedVolume}`;
    if (favoritesSet.has(favKeyForCard())) favAction.classList.add('active');

    availableVolumes.forEach(v => {
        const wbtn = document.createElement('div');
        wbtn.className = 'weight-option' + (Number(v) === cardSelectedVolume ? ' active' : '');
        wbtn.innerText = v + ' г';
        wbtn.onclick = () => {
            cardSelectedVolume = Number(v);
            card.querySelectorAll('.weight-option').forEach(n => n.classList.remove('active'));
            wbtn.classList.add('active');
            const big = isCardCupBig(cardSelectedVolume);
            cardCupImg.src = big ? base.big : base.small;
            cardCupImg.style.width = big ? '120px' : '80px';
            const unitPrice = getPriceForVolume(prod, cardSelectedVolume);
            priceBtn.innerText = (unitPrice * cardQuantity) + ' ₽';
            if (favoritesSet.has(favKeyForCard())) favAction.classList.add('active'); else favAction.classList.remove('active');
            volume = cardSelectedVolume;
        };
        weightsContainer.appendChild(wbtn);
    });

    favAction.onclick = () => {
        // Проверка авторизации
        if (!isAuthenticated) {
            alert('Пожалуйста, войдите, чтобы добавлять товары в избранное');
            return;
        }
        const key = favKeyForCard();
        if (favoritesSet.has(key)) favoritesSet.delete(key);
        else favoritesSet.add(key);
        favAction.classList.toggle('active');
        updateFavCountUI();
        saveToLocalStorage();
    };

    qinputCard.addEventListener('input', (e) => {
        let v = parseInt(e.target.value) || 1;
        if (v < 1) v = 1;
        cardQuantity = v;
        const unitPrice = getPriceForVolume(prod, cardSelectedVolume);
        priceBtn.innerText = (unitPrice * cardQuantity) + ' ₽';
    });
    qminus.onclick = () => {
        if (cardQuantity > 1) {
            cardQuantity--;
            qinputCard.value = cardQuantity;
            const unitPrice = getPriceForVolume(prod, cardSelectedVolume);
            priceBtn.innerText = (unitPrice * cardQuantity) + ' ₽';
        }
    };
    qplus.onclick = () => {
        cardQuantity++;
        qinputCard.value = cardQuantity;
        const unitPrice = getPriceForVolume(prod, cardSelectedVolume);
        priceBtn.innerText = (unitPrice * cardQuantity) + ' ₽';
    };

    priceBtn.onclick = () => {
        // Проверка авторизации
        if (!isAuthenticated) {
            alert('Пожалуйста, войдите, чтобы добавлять товары в корзину');
            return;
        }
        const key = `${base.name}__${selectedType}__${info.filter.id}__${cardSelectedVolume}`;
        const unitPrice = getPriceForVolume(prod, cardSelectedVolume);
        const existing = cartMap.get(key);
        const curQty = existing ? existing.quantity : 0;
        const newQty = curQty + cardQuantity;
        if (newQty <= prod.stock) {
            cartMap.set(key, {
                productId: prod.id,
                name: base.name,
                type: selectedType,
                filterId: info.filter.id,
                productTitle: prod.title,
                volume: cardSelectedVolume,
                quantity: newQty,
                unitPrice: unitPrice
            });
            updateCartUI();
            saveToLocalStorage();
            priceBtn.classList.add('pressed');
            setTimeout(() => priceBtn.classList.remove('pressed'), 140);
        } else {
            alert('Больше нет на складе в нужном количестве');
        }
        renderProductsGrid();
    };
}

/* ================= ИЗБРАННОЕ ================= */
function updateFavCountUI() {
    const n = favoritesSet.size;
    if (favCountNode) {
        favCountNode.innerText = n;
        favCountNode.style.display = n > 0 ? "inline-block" : "none";
    }
    if (favSummaryNode) favSummaryNode.innerText = `Всего: ${n} товаров`;
}

function renderFavoritesPage() {
    favoritesItemsNode.innerHTML = "";
    for (const key of favoritesSet) {
        const parts = key.split('__');
        const coffeeNameKey = parts[0];
        const coffee = coffees.find(c => c.name === coffeeNameKey);
        if (!coffee) continue;
        const type = parts[1];
        const filterId = parts[2];
        const vol = Number(parts[3] || 500);
        const typeGroup = coffee.types[type];
        if (!typeGroup) continue;
        const filt = typeGroup.filters.find(f => f.id === filterId);
        if (!filt) continue;
        const prod = filt.product;
        const price = prod.prices[vol] || getPriceForVolume(prod, vol);

        const big = isBigCup(prod, vol);
        const cupSrc = big ? coffee.big : coffee.small;
        const cupWidth = big ? 80 : 50;

        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <img src="${cupSrc}" alt="cup" style="width:${cupWidth}px; image-rendering:pixelated;">
                <div style="flex:1;">
                    <h3 style="margin:0 0 4px; font-size:18px;">${prod.title}</h3>
                    <div class="meta">${vol} г</div>
                    <div class="price" style="font-size:16px;">${price} руб</div>
                </div>
            </div>
            <div style="margin-top:8px; text-align:right;">
                <button class="text-action" onclick="removeFromFavorites('${key}')">Удалить</button>
            </div>
        `;
        favoritesItemsNode.appendChild(div);
    }
    if (favSummaryNode) favSummaryNode.innerText = `Всего: ${favoritesSet.size} товаров`;
}

function removeFromFavorites(key) {
    favoritesSet.delete(key);
    renderFavoritesPage();
    renderShop();
    saveToLocalStorage();
}

/* ================= КОРЗИНА ================= */
function updateCartUI() {
    let totalItems = 0;
    let totalPrice = 0;
    for (const item of cartMap.values()) {
        totalItems += item.quantity;
        totalPrice += item.unitPrice * item.quantity;
    }
    if (cartCountNode) cartCountNode.innerText = totalItems;
    if (cartPriceNode) cartPriceNode.innerText = totalPrice + ' ₽';
}

function renderCartPage() {
    cartItemsNode.innerHTML = "";
    let subtotal = 0;
    for (const [key, item] of cartMap) {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;

        const info = getCartItemInfo(key);
        let cupSrc = "";
        let cupWidth = 60;
        if (info) {
            const big = isBigCup(info.product, item.volume);
            cupSrc = big ? info.base.big : info.base.small;
            cupWidth = big ? 80 : 50;
        } else {
            cupSrc = "/static/images/cup-placeholder.png";
        }

        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <img src="${cupSrc}" alt="cup" style="width:${cupWidth}px; image-rendering:pixelated;">
                <div style="flex:1;">
                    <h3 style="margin:0 0 4px; font-size:18px;">${item.productTitle}</h3>
                    <div class="meta">${item.volume} г × ${item.quantity} шт</div>
                    <div class="price" style="font-size:16px;">${itemTotal} руб</div>
                </div>
            </div>
            <div style="margin-top:8px; text-align:right;">
                <button class="text-action" onclick="removeFromCart('${key}')">Удалить</button>
            </div>
        `;
        cartItemsNode.appendChild(div);
    }

    let totalAfterPromo = subtotal;
    if (promoApplied) totalAfterPromo = Math.round(subtotal * (1 - PROMO_RATE));

    if (promoApplied) {
        totalPriceNode.innerHTML = `<span style="color:#888;text-decoration:line-through;text-decoration-color:red;text-decoration-thickness:2px;padding-right:8px;">${subtotal} руб</span><span style="color:#d10000;font-weight:700;"> ${totalAfterPromo} руб</span>`;
    } else {
        totalPriceNode.innerText = "Итого: " + subtotal + " руб";
    }
    updateCartUI();
}

function removeFromCart(key) {
    cartMap.delete(key);
    updateCartUI();
    renderShop();
    renderCartPage();
    saveToLocalStorage();
}

/* ================= ВАЛИДАЦИЯ ================= */
function validateName() {
    const input = document.getElementById('orderName');
    const error = document.getElementById('nameError');
    if (input.value.trim() === "") {
        input.classList.add('input-error');
        error.style.display = 'block';
        return false;
    } else {
        input.classList.remove('input-error');
        error.style.display = 'none';
        return true;
    }
}
function validateAddress() {
    const input = document.getElementById('orderAddress');
    const error = document.getElementById('addressError');
    if (input.value.trim() === "") {
        input.classList.add('input-error');
        error.style.display = 'block';
        return false;
    } else {
        input.classList.remove('input-error');
        error.style.display = 'none';
        return true;
    }
}
function validatePhone() {
    const input = document.getElementById('orderPhone');
    const error = document.getElementById('phoneError');
    const phone = input.value.trim();
    const phoneRegex = /^\+\d+$/;
    if (phoneRegex.test(phone)) {
        input.classList.remove('input-error');
        error.style.display = 'none';
        return true;
    } else {
        input.classList.add('input-error');
        error.style.display = 'block';
        return false;
    }
}
function validateEmail() {
    const input = document.getElementById('orderEmail');
    const error = document.getElementById('emailError');
    const email = input.value.trim();
    if (email.includes('@')) {
        input.classList.remove('input-error');
        error.style.display = 'none';
        return true;
    } else {
        input.classList.add('input-error');
        error.style.display = 'block';
        return false;
    }
}
function openCheckout() {
    shopPage.style.display = "none";
    favoritesPage.style.display = "none";
    cartPage.style.display = "none";
    promosPage.style.display = "none";
    checkoutPage.style.display = "block";
    document.querySelectorAll('#checkoutPage .input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('#checkoutPage .error-message').forEach(el => el.style.display = 'none');
}
async function submitOrder() {
    const nameValid = validateName();
    const addressValid = validateAddress();
    const phoneValid = validatePhone();
    const emailValid = validateEmail();

    if (!nameValid || !addressValid || !phoneValid || !emailValid) return;

    const name = document.getElementById('orderName').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const email = document.getElementById('orderEmail').value.trim();

    // Преобразуем корзину в массив товаров для отправки
    const items = [];
    for (const [key, item] of cartMap.entries()) {
        items.push({
            product_id: item.productId,
            volume: item.volume,
            quantity: item.quantity,
            price: item.unitPrice
        });
    }

    if (items.length === 0) {
        alert('Корзина пуста');
        return;
    }

    // Получаем CSRF-токен из куки
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    try {
        const response = await fetch('/api/orders/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                full_name: name,
                address: address,
                phone: phone,
                email: email,
                items: items
            })
        });

        const data = await response.json();
        if (response.ok) {
            // Очищаем корзину
            cartMap.clear();
            updateCartUI();
            saveToLocalStorage();

            // Показываем подтверждение
            const confirmationDataDiv = document.getElementById('confirmationData');
            confirmationDataDiv.innerHTML = `
                <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
                <p><strong>Адрес:</strong> ${escapeHtml(address)}</p>
                <p><strong>Телефон:</strong> ${escapeHtml(phone)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Номер заказа:</strong> ${data.order_id}</p>
            `;

            shopPage.style.display = "none";
            favoritesPage.style.display = "none";
            cartPage.style.display = "none";
            checkoutPage.style.display = "none";
            promosPage.style.display = "none";
            orderConfirmation.style.display = "block";

            setTimeout(() => {
                const truckImage = document.querySelector('#orderConfirmation .truck-image');
                if (truckImage) truckImage.classList.add('truck-moving');
            }, 2000);
        } else {
            alert('Ошибка: ' + (data.error || 'Не удалось оформить заказ'));
        }
    } catch (err) {
        console.error(err);
        alert('Произошла ошибка при отправке заказа');
    }
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
function backToShopFromConfirmation() {
    orderConfirmation.style.display = "none";
    openShop();
}

/* ================= ПРОМОКОД ================= */
if (promoApplyBtn) {
    promoApplyBtn.addEventListener('click', () => {
        const val = (promoInput.value || "").trim().toLowerCase();
        if (val === PROMO_CODE) {
            promoApplied = true;
            promoMsg.style.display = 'inline-block';
            promoInput.classList.add('active');
        } else {
            promoApplied = false;
            promoMsg.style.display = 'none';
            promoInput.classList.remove('active');
            promoInput.style.borderColor = '#cc0000';
            setTimeout(() => promoInput.style.borderColor = '', 800);
        }
        renderCartPage();
    });
}

/* ================= НАВИГАЦИЯ ================= */
function openCart() {
    shopPage.style.display = "none";
    favoritesPage.style.display = "none";
    promosPage.style.display = "none";
    checkoutPage.style.display = "none";
    orderConfirmation.style.display = "none";
    cartPage.style.display = "block";
    renderCartPage();
}
function openFavorites() {
    shopPage.style.display = "none";
    cartPage.style.display = "none";
    promosPage.style.display = "none";
    checkoutPage.style.display = "none";
    orderConfirmation.style.display = "none";
    favoritesPage.style.display = "block";
    renderFavoritesPage();
}
function openPromos() {
    shopPage.style.display = "none";
    cartPage.style.display = "none";
    favoritesPage.style.display = "none";
    checkoutPage.style.display = "none";
    orderConfirmation.style.display = "none";
    promosPage.style.display = "block";
}
function openShop() {
    cartPage.style.display = "none";
    favoritesPage.style.display = "none";
    promosPage.style.display = "none";
    checkoutPage.style.display = "none";
    orderConfirmation.style.display = "none";
    shopPage.style.display = "block";
    renderShop();
}

if (shopLink) shopLink.addEventListener('click', (e) => { e.preventDefault(); openShop(); });
if (cartLink) cartLink.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
if (favoritesLink) favoritesLink.addEventListener('click', (e) => { e.preventDefault(); openFavorites(); });
if (promosLink) promosLink.addEventListener('click', (e) => { e.preventDefault(); openPromos(); });
if (mainTitle) mainTitle.addEventListener('click', openShop);

/* ================= ЛИСТАЛКА ЧАШЕК ================= */
function nextCoffee() { index = (index + 1) % coffees.length; selectedFilterIndex = 0; renderShop(); }
function prevCoffee() { index = (index - 1 + coffees.length) % coffees.length; selectedFilterIndex = 0; renderShop(); }

/* ================= ВЫБОР ТИПА ================= */
function selectType(type, e) {
    selectedType = type;
    selectedFilterIndex = 0;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    if (e && e.currentTarget) e.currentTarget.classList.add('active');
    renderFilters();
    renderProductsGrid();
    renderShop();
}

/* ================= БАННЕРЫ ================= */
function onBanner1Click() {
    const idx = coffees.findIndex(c => c.name === "Arabica");
    if (idx >= 0) { index = idx; renderShop(); openShop(); }
    else openShop();
}
function onBanner2Click(e) { e && e.preventDefault(); }
function onBanner3Click() {
    if (promoInput) promoInput.value = PROMO_CODE;
    openCart();
}

/* ================= ИНИЦИАЛИЗАЦИЯ ================= */
loadData();