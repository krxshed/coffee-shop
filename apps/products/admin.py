from django.contrib import admin
from .models import CoffeeType, ProcessingType, RoastLevel, Product

@admin.register(CoffeeType)
class CoffeeTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'stock')
    search_fields = ('name',)

@admin.register(ProcessingType)
class ProcessingTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'label')

@admin.register(RoastLevel)
class RoastLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'label')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'coffee_type', 'processing', 'roast_level', 'stock')
    list_filter = ('coffee_type', 'processing', 'roast_level')
    search_fields = ('title',)