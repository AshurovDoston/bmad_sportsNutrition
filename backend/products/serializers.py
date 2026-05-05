from rest_framework import serializers
from .models import GoalCategory, Product, ProductImage, ProductReview


class GoalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalCategory
        fields = ['id', 'name', 'slug', 'why_it_works']
        read_only_fields = fields


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'is_primary']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class ProductReviewSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ['id', 'reviewer_name', 'rating', 'review_text', 'is_verified', 'photo_url']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    goal_categories = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()
    certificate_url = serializers.SerializerMethodField()
    why_this_works = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'is_in_stock',
            'goal_categories', 'primary_image_url', 'certificate_url',
            'delivery_hours', 'why_this_works',
        ]

    def get_goal_categories(self, obj):
        return list(obj.goal_categories.values_list('slug', flat=True))

    def get_primary_image_url(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary and primary.image:
            request = self.context.get('request')
            return request.build_absolute_uri(primary.image.url) if request else primary.image.url
        return None

    def get_certificate_url(self, obj):
        if obj.certificate_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.certificate_file.url) if request else obj.certificate_file.url
        return None

    def get_why_this_works(self, obj):
        goal_slug = self.context.get('goal_slug')
        if goal_slug:
            tag = obj.goal_tags.filter(goal__slug=goal_slug).first()
            if tag:
                return tag.why_this_works
        tag = obj.goal_tags.first()
        return tag.why_this_works if tag else ''


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            'description', 'nutrition_facts', 'images', 'reviews',
        ]
