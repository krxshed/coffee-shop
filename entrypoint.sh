#!/bin/sh

python manage.py migrate

echo "Creating superuser if not exists..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print("Superuser 'admin' created (password: admin)")
else:
    print("Superuser already exists")
EOF

echo "Checking if products need to be added..."
python manage.py shell <<EOF
from apps.products.models import Product
if Product.objects.count() == 0:
    exit(1)
EOF

# Проверяем код возврата последней команды
if [ $? -eq 1 ]; then
    echo "Adding products..."
    python fill_db.py
else
    echo "Products already exist"
fi

exec gunicorn coffee_shop.wsgi:application --bind 0.0.0.0:8000
