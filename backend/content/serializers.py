from rest_framework import serializers
from products.models import Product
from .models import ConfusionEntry


class ConfusionRecommendedProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price']


class ConfusionEntrySerializer(serializers.ModelSerializer):
    recommended_products = ConfusionRecommendedProductSerializer(many=True, read_only=True)

    class Meta:
        model = ConfusionEntry
        fields = ['id', 'question', 'answer', 'recommended_products']
