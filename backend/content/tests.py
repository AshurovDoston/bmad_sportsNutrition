from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Product, GoalCategory
from content.models import ConfusionEntry

CONFUSION_URL = '/api/v1/confusion/'


class ConfusionEntryListTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_confusion_list_publicly_accessible(self):
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_confusion_list_returns_published_entries_only(self):
        ConfusionEntry.objects.create(question='Published Q', answer='A', is_published=True)
        ConfusionEntry.objects.create(question='Hidden Q', answer='A', is_published=False)
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        questions = [e['question'] for e in res.data]
        self.assertIn('Published Q', questions)
        self.assertNotIn('Hidden Q', questions)

    def test_confusion_list_returns_recommended_products(self):
        GoalCategory.objects.create(name='Muscle Gain', slug='muscle_gain', why_it_works='')
        product = Product.objects.create(
            name='Test Protein', slug='test-protein', description='', price='29.99',
            stock_quantity=10, is_in_stock=True, brand='Test', delivery_hours=2
        )
        entry = ConfusionEntry.objects.create(question='Q', answer='A', is_published=True)
        entry.recommended_products.add(product)
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data[0]['recommended_products']), 1)
        self.assertEqual(res.data[0]['recommended_products'][0]['slug'], 'test-protein')

    def test_confusion_list_empty_returns_empty_array(self):
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])
