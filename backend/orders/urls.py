from django.urls import path
from .views import CartView, CartItemCreateView, CartItemUpdateDeleteView, CartMergeView, OrderCreateView, OrderDetailView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-detail'),
    path('cart/merge/', CartMergeView.as_view(), name='cart-merge'),
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
