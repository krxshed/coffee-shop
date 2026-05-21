from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views
from apps.users.views import register
from apps.products.views import products_list
from apps.orders.views import create_order
from apps.reports.views import export_report

urlpatterns = [
   path('admin/export-report/', export_report, name='export_report'),
    path('admin/', admin.site.urls),
    path('api/products/', products_list, name='api_products'),
    path('api/orders/create/', create_order, name='create_order'),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='home'), name='logout'),
    path('register/', register, name='register'),
]