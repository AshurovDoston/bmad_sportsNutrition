from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import health_check

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    # Domain API routes added as each story is implemented:
    # path('api/v1/', include('accounts.urls')),
    # path('api/v1/', include('products.urls')),
    # path('api/v1/', include('orders.urls')),
    # path('api/v1/', include('content.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
