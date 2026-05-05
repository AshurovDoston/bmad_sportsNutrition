from django.db import models


class GoalCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    why_it_works = models.TextField()

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    brand = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_in_stock = models.BooleanField(default=True)
    nutrition_facts = models.JSONField(default=dict)
    sort_order = models.IntegerField(default=0)
    delivery_hours = models.IntegerField(default=2)
    goal_categories = models.ManyToManyField(
        GoalCategory, through='ProductGoalTag'
    )
    certificate_file = models.FileField(upload_to='certificates/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class ProductGoalTag(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='goal_tags')
    goal = models.ForeignKey(GoalCategory, on_delete=models.CASCADE)
    why_this_works = models.TextField()

    class Meta:
        unique_together = [['product', 'goal']]

    def __str__(self):
        return f"{self.product.name} — {self.goal.name}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_primary']

    def __str__(self):
        return f"{self.product.name} image"


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    reviewer_name = models.CharField(max_length=100)
    rating = models.IntegerField()
    review_text = models.TextField()
    is_verified = models.BooleanField(default=False)
    photo = models.ImageField(upload_to='reviews/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reviewer_name} — {self.product.name}"
