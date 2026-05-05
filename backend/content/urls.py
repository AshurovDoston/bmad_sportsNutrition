from django.urls import path
from .views import ConfusionEntryListView

urlpatterns = [
    path('confusion/', ConfusionEntryListView.as_view(), name='confusion-list'),
]
