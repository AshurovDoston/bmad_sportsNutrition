import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    goal = django_filters.CharFilter(field_name='goal_categories__slug', lookup_expr='iexact')
    brand = django_filters.CharFilter(lookup_expr='icontains')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['goal', 'brand', 'min_price', 'max_price']
