from django.db import models
from django.conf import settings
from apps.products.models import Product
from apps.core.models import TimeStampedModel

class Favorite(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    volume = models.PositiveIntegerField()

    class Meta:
        unique_together = ('user', 'product', 'volume')

    def __str__(self):
        return f"{self.user.username} - {self.product.title} ({self.volume}g)"