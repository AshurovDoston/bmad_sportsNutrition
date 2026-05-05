from django.db import models


class ConfusionEntry(models.Model):
    question = models.TextField()
    answer = models.TextField()
    recommended_products = models.ManyToManyField(
        'products.Product',
        blank=True,
        related_name='confusion_entries'
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question[:80]

    class Meta:
        verbose_name_plural = 'Confusion Entries'
