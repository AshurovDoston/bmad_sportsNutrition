from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from .models import GoalCategory, Product, ProductGoalTag

GOALS_URL = '/api/v1/goals/'
PRODUCTS_URL = '/api/v1/products/'


def make_goal(name='Muscle Gain', slug='muscle_gain', why='Builds protein synthesis'):
    return GoalCategory.objects.create(name=name, slug=slug, why_it_works=why)


def make_product(name='Test Protein', slug='test-protein', brand='TestBrand', price='29.99'):
    return Product.objects.create(name=name, slug=slug, brand=brand, price=price)


class GoalListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.goal = make_goal()

    def test_goal_list_returns_200(self):
        res = self.client.get(GOALS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_goal_list_contains_required_fields(self):
        res = self.client.get(GOALS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        item = data[0]
        for field in ['id', 'name', 'slug', 'why_it_works']:
            self.assertIn(field, item)

    def test_goal_list_no_auth_required(self):
        # Unauthenticated client (no credentials)
        res = self.client.get(GOALS_URL)
        self.assertNotEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_goal_list_not_paginated(self):
        # Goals list must return a plain list, not paginated dict
        res = self.client.get(GOALS_URL)
        data = res.json()
        self.assertIsInstance(data, list)


class ProductListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.goal = make_goal()
        self.product = make_product()
        ProductGoalTag.objects.create(
            product=self.product, goal=self.goal, why_this_works='Great for goals'
        )

    def test_product_list_returns_200(self):
        res = self.client.get(PRODUCTS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_product_list_is_paginated(self):
        res = self.client.get(PRODUCTS_URL)
        data = res.json()
        for key in ['results', 'count', 'next', 'previous']:
            self.assertIn(key, data)

    def test_product_list_contains_required_fields(self):
        res = self.client.get(PRODUCTS_URL)
        results = res.json()['results']
        self.assertGreater(len(results), 0)
        item = results[0]
        for field in ['id', 'name', 'slug', 'price', 'is_in_stock',
                      'goal_categories', 'primary_image_url', 'certificate_url',
                      'delivery_hours', 'why_this_works']:
            self.assertIn(field, item)

    def test_goal_filter_returns_matching_products(self):
        other_goal = make_goal(name='Fat Loss', slug='fat_loss', why='Burns fat')
        other_product = make_product(name='Fat Burner', slug='fat-burner', brand='BurnBrand', price='19.99')
        ProductGoalTag.objects.create(
            product=other_product, goal=other_goal, why_this_works='Burns fat fast'
        )

        res = self.client.get(PRODUCTS_URL, {'goal': 'muscle_gain'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.json()['results']
        slugs = [p['slug'] for p in results]
        self.assertIn('test-protein', slugs)
        self.assertNotIn('fat-burner', slugs)

    def test_brand_filter_returns_matching_products(self):
        other_product = make_product(name='Other Product', slug='other-product', brand='OtherBrand', price='15.00')
        res = self.client.get(PRODUCTS_URL, {'brand': 'TestBrand'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.json()['results']
        brands = [p['slug'] for p in results]
        self.assertIn('test-protein', brands)
        self.assertNotIn('other-product', brands)

    def test_price_filter_min_max(self):
        cheap = make_product(name='Cheap Product', slug='cheap', brand='Brand', price='5.00')
        expensive = make_product(name='Expensive Product', slug='expensive', brand='Brand', price='100.00')

        res = self.client.get(PRODUCTS_URL, {'min_price': '10', 'max_price': '50'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        slugs = [p['slug'] for p in res.json()['results']]
        self.assertIn('test-protein', slugs)
        self.assertNotIn('cheap', slugs)
        self.assertNotIn('expensive', slugs)

    def test_product_list_no_auth_required(self):
        res = self.client.get(PRODUCTS_URL)
        self.assertNotEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class ProductDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.goal = make_goal()
        self.product = make_product()
        ProductGoalTag.objects.create(
            product=self.product, goal=self.goal, why_this_works='Great for goals'
        )

    def test_product_detail_returns_200(self):
        res = self.client.get(f'{PRODUCTS_URL}{self.product.slug}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_product_detail_contains_required_fields(self):
        res = self.client.get(f'{PRODUCTS_URL}{self.product.slug}/')
        data = res.json()
        for field in ['nutrition_facts', 'description', 'images', 'reviews']:
            self.assertIn(field, data)

    def test_product_detail_404_for_unknown_slug(self):
        res = self.client.get(f'{PRODUCTS_URL}does-not-exist/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_product_detail_no_auth_required(self):
        res = self.client.get(f'{PRODUCTS_URL}{self.product.slug}/')
        self.assertNotEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class SchemaEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_schema_endpoint_returns_200(self):
        res = self.client.get('/api/v1/schema/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
