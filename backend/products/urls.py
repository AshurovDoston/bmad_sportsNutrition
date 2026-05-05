from django.urls import path
from .views import GoalListView, ProductListView, ProductDetailView

urlpatterns = [
    path('goals/', GoalListView.as_view(), name='goal-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
]
