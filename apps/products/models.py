from django.db import models
from apps.core.models import TimeStampedModel

class CoffeeType(TimeStampedModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    small_cup = models.ImageField(upload_to='cups/')
    big_cup = models.ImageField(upload_to='cups/')
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name

class ProcessingType(TimeStampedModel):
    name = models.CharField(max_length=30, unique=True)
    label = models.CharField(max_length=50)

    def __str__(self):
        return self.label

class RoastLevel(TimeStampedModel):
    name = models.CharField(max_length=30)
    label = models.CharField(max_length=100)

    def __str__(self):
        return self.label

class Product(TimeStampedModel):
    coffee_type = models.ForeignKey(CoffeeType, on_delete=models.CASCADE)
    processing = models.ForeignKey(ProcessingType, on_delete=models.CASCADE)
    roast_level = models.ForeignKey(RoastLevel, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    price_250 = models.PositiveIntegerField(default=0)
    price_500 = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/')
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title