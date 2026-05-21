from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
import json
from .models import Order, OrderItem
from apps.products.models import Product

@require_http_methods(["POST"])
@login_required
def create_order(request):
    """
    Создаёт заказ из переданных товаров корзины.
    Ожидает JSON:
    {
        "full_name": "Имя",
        "address": "Адрес",
        "phone": "+79123456789",
        "email": "user@example.com",
        "items": [
            {"product_id": 1, "volume": 500, "quantity": 2, "price": 1500},
            ...
        ]
    }
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный формат JSON'}, status=400)

    full_name = data.get('full_name')
    address = data.get('address')
    phone = data.get('phone')
    email = data.get('email')
    items = data.get('items', [])

    if not all([full_name, address, phone, email]):
        return JsonResponse({'error': 'Заполните все поля'}, status=400)
    if not items:
        return JsonResponse({'error': 'Корзина пуста'}, status=400)

    # Создаём заказ
    order = Order.objects.create(
        user=request.user,
        full_name=full_name,
        address=address,
        phone=phone,
        email=email,
        status='pending',
        total=0
    )

    total_order = 0
    for item in items:
        product_id = item.get('product_id')
        volume = item.get('volume')
        quantity = item.get('quantity')
        price = item.get('price')

        if not all([product_id, volume, quantity, price]):
            return JsonResponse({'error': 'Неполные данные о товаре'}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return JsonResponse({'error': f'Товар id={product_id} не найден'}, status=400)

        OrderItem.objects.create(
            order=order,
            product=product,
            product_title=product.title,
            volume=volume,
            quantity=quantity,
            price=price
        )
        total_order += price * quantity

    order.total = total_order
    order.save()

    return JsonResponse({'order_id': order.id, 'status': 'created'})