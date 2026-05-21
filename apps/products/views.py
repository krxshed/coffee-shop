from django.http import JsonResponse
from .models import Product

def products_list(request):
    products = Product.objects.all()
    data = []
    for product in products:
        data.append({
            'id': product.id,
            'title': product.title,
            'subtitle': product.subtitle,
            'desc': product.description,
            'prices': {
                250: product.price_250,
                500: product.price_500,
            },
            'img': f"/static/{product.image}" if product.image else "",
            'stock': product.stock,
            'coffee_type': product.coffee_type.name,
            'processing': product.processing.name,
            'roast_level': product.roast_level.name,
        })
    return JsonResponse(data, safe=False)