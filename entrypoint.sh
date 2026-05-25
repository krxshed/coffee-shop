#!/bin/sh
set -e

python manage.py migrate

python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print("Superuser 'admin' created (password: admin)")
else:
    print("Superuser already exists")
EOF

python manage.py shell <<EOF
from apps.products.models import Product
if Product.objects.count() == 0:
    exec(open('fill_db.py').read())
    print("Products added")
else:
    print("Products already exist")
EOF

exec gunicorn coffee_shop.wsgi:application --bind 0.0.0.0:8000