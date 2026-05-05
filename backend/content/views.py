from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import ConfusionEntry
from .serializers import ConfusionEntrySerializer


class ConfusionEntryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ConfusionEntrySerializer
    pagination_class = None
    queryset = ConfusionEntry.objects.filter(is_published=True).prefetch_related('recommended_products')
