from django.db import models
from django.conf import settings
from apps.products.models import Product
from apps.core.models import TimeStampedModel

class CartItem(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    volume = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('user', 'product', 'volume')

    def total_price(self):
        price_attr = f'price_{self.volume}'
        price = getattr(self.product, price_attr, 0)
        return price * self.quantity

    def __str__(self):
        return f"{self.user.username} - {self.product.title} ({self.volume}g)"