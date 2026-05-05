from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import GoalCategory, Product
from .serializers import GoalCategorySerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter


class GoalListView(ListAPIView):
    permission_classes = [AllowAny]
    queryset = GoalCategory.objects.all()
    serializer_class = GoalCategorySerializer
    pagination_class = None


class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_queryset(self):
        return Product.objects.prefetch_related(
            'goal_categories', 'goal_tags', 'goal_tags__goal', 'images'
        ).order_by('sort_order', 'name')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['goal_slug'] = self.request.query_params.get('goal')
        return ctx


class ProductDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.prefetch_related(
            'goal_categories', 'goal_tags', 'goal_tags__goal', 'images', 'reviews'
        )
