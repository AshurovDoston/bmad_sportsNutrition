from django.contrib import admin
from .models import GoalCategory, Product, ProductGoalTag, ProductImage, ProductReview


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'brand', 'price', 'is_in_stock', 'sort_order']


admin.site.register(GoalCategory)
admin.site.register(ProductGoalTag)
admin.site.register(ProductImage)
admin.site.register(ProductReview)
