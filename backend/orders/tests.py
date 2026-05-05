from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import CustomUser
from products.models import Product
from .models import Cart, CartItem

CART_URL = '/api/v1/cart/'
CART_ITEMS_URL = '/api/v1/cart/items/'
CART_MERGE_URL = '/api/v1/cart/merge/'


def make_user(phone='+998901234567', password='testpass', name='Test User'):
    return CustomUser.objects.create_user(phone=phone, password=password, name=name)


def make_product(name='Whey', slug='whey', price='29.99', in_stock=True, stock_quantity=10):
    return Product.objects.create(
        name=name, slug=slug, brand='Brand', description='',
        price=price, is_in_stock=in_stock, stock_quantity=stock_quantity, delivery_hours=2
    )


class CartAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_cart_requires_auth(self):
        res = self.client.get(CART_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_cart_item_requires_auth(self):
        res = self.client.post(CART_ITEMS_URL, {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_cart_item_requires_auth(self):
        res = self.client.patch(f'{CART_ITEMS_URL}1/', {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_cart_item_requires_auth(self):
        res = self.client.delete(f'{CART_ITEMS_URL}1/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_merge_requires_auth(self):
        res = self.client.post(CART_MERGE_URL, [], format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CartGetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_get_creates_cart_if_not_exists(self):
        self.assertFalse(Cart.objects.filter(user=self.user).exists())
        res = self.client.get(CART_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(Cart.objects.filter(user=self.user).exists())

    def test_get_returns_correct_structure(self):
        res = self.client.get(CART_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('id', res.data)
        self.assertIn('items', res.data)
        self.assertIn('subtotal', res.data)
        self.assertEqual(res.data['items'], [])
        self.assertEqual(res.data['subtotal'], '0')


class CartAddItemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.product = make_product()

    def test_add_new_item_to_cart(self):
        res = self.client.post(CART_ITEMS_URL, {'product_id': self.product.id, 'quantity': 2}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['items']), 1)
        self.assertEqual(res.data['items'][0]['quantity'], 2)

    def test_add_existing_item_sums_quantity(self):
        self.client.post(CART_ITEMS_URL, {'product_id': self.product.id, 'quantity': 2}, format='json')
        res = self.client.post(CART_ITEMS_URL, {'product_id': self.product.id, 'quantity': 3}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['items'][0]['quantity'], 5)

    def test_add_out_of_stock_returns_400(self):
        out_of_stock = make_product(name='OOS', slug='oos', in_stock=False, stock_quantity=0)
        res = self.client.post(CART_ITEMS_URL, {'product_id': out_of_stock.id, 'quantity': 1}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'product_out_of_stock')

    def test_add_nonexistent_product_returns_404(self):
        res = self.client.post(CART_ITEMS_URL, {'product_id': 99999, 'quantity': 1}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class CartUpdateItemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.product = make_product()
        res = self.client.post(CART_ITEMS_URL, {'product_id': self.product.id, 'quantity': 2}, format='json')
        self.item_id = res.data['items'][0]['id']

    def test_patch_updates_quantity(self):
        res = self.client.patch(f'{CART_ITEMS_URL}{self.item_id}/', {'quantity': 5}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['items'][0]['quantity'], 5)

    def test_patch_another_users_item_returns_404(self):
        other_user = make_user(phone='+998907654321')
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        res = other_client.patch(f'{CART_ITEMS_URL}{self.item_id}/', {'quantity': 1}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class CartDeleteItemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.product = make_product()
        res = self.client.post(CART_ITEMS_URL, {'product_id': self.product.id, 'quantity': 2}, format='json')
        self.item_id = res.data['items'][0]['id']

    def test_delete_removes_item(self):
        res = self.client.delete(f'{CART_ITEMS_URL}{self.item_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['items'], [])

    def test_delete_another_users_item_returns_404(self):
        other_user = make_user(phone='+998907654321')
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        res = other_client.delete(f'{CART_ITEMS_URL}{self.item_id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class CartMergeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.p1 = make_product(name='Whey', slug='whey')
        self.p2 = make_product(name='Creatine', slug='creatine')

    def test_merge_adds_new_items(self):
        payload = [
            {'product_id': self.p1.id, 'quantity': 2},
            {'product_id': self.p2.id, 'quantity': 1},
        ]
        res = self.client.post(CART_MERGE_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['items']), 2)

    def test_merge_sums_quantities_for_duplicates(self):
        self.client.post(CART_ITEMS_URL, {'product_id': self.p1.id, 'quantity': 3}, format='json')
        payload = [{'product_id': self.p1.id, 'quantity': 2}]
        res = self.client.post(CART_MERGE_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item = next(i for i in res.data['items'] if i['product']['id'] == self.p1.id)
        self.assertEqual(item['quantity'], 5)

    def test_merge_skips_out_of_stock_products(self):
        oos = make_product(name='OOS', slug='oos', in_stock=False, stock_quantity=0)
        payload = [
            {'product_id': self.p1.id, 'quantity': 1},
            {'product_id': oos.id, 'quantity': 1},
        ]
        res = self.client.post(CART_MERGE_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        product_ids = [i['product']['id'] for i in res.data['items']]
        self.assertIn(self.p1.id, product_ids)
        self.assertNotIn(oos.id, product_ids)

    def test_merge_empty_list_returns_current_cart(self):
        self.client.post(CART_ITEMS_URL, {'product_id': self.p1.id, 'quantity': 1}, format='json')
        res = self.client.post(CART_MERGE_URL, [], format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['items']), 1)


ORDERS_URL = '/api/v1/orders/'


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_post_order_requires_auth(self):
        res = self.client.post(ORDERS_URL, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.p1 = make_product(name='Whey', slug='whey-order', price='29.99', stock_quantity=10)
        self.p2 = make_product(name='Creatine', slug='creatine-order', price='19.99', stock_quantity=5)

    def _payload(self, items=None, address='Tashkent, Test Street 1'):
        return {
            'delivery_address': address,
            'items': items or [
                {'product_id': self.p1.id, 'quantity': 2},
                {'product_id': self.p2.id, 'quantity': 1},
            ],
        }

    def test_create_order_returns_201(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_response_contains_required_fields(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        for field in ['order_id', 'order_number', 'items', 'subtotal', 'delivery_address', 'status', 'created_at']:
            self.assertIn(field, res.data)

    def test_order_status_is_pending(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        self.assertEqual(res.data['status'], 'pending')

    def test_order_number_format(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        self.assertTrue(res.data['order_number'].startswith('ORD-'))

    def test_order_and_items_persisted(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        from .models import Order, OrderItem
        self.assertTrue(Order.objects.filter(id=res.data['order_id']).exists())
        self.assertEqual(OrderItem.objects.filter(order_id=res.data['order_id']).count(), 2)

    def test_stock_decremented(self):
        self.client.post(ORDERS_URL, self._payload(), format='json')
        self.p1.refresh_from_db()
        self.p2.refresh_from_db()
        self.assertEqual(self.p1.stock_quantity, 8)  # 10 - 2
        self.assertEqual(self.p2.stock_quantity, 4)  # 5 - 1

    def test_stock_hits_zero_marks_out_of_stock(self):
        p = make_product(name='LowStock', slug='low-stock', price='9.99', stock_quantity=1)
        payload = {'delivery_address': 'Addr1', 'items': [{'product_id': p.id, 'quantity': 1}]}
        self.client.post(ORDERS_URL, payload, format='json')
        p.refresh_from_db()
        self.assertEqual(p.stock_quantity, 0)
        self.assertFalse(p.is_in_stock)

    def test_subtotal_correct(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        # p1: 29.99 × 2 = 59.98; p2: 19.99 × 1 = 19.99; total = 79.97
        self.assertEqual(res.data['subtotal'], '79.97')


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderOutOfStockTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_out_of_stock_returns_400(self):
        oos = make_product(name='OOS', slug='oos-order', in_stock=False, stock_quantity=0)
        payload = {'delivery_address': 'Addr1', 'items': [{'product_id': oos.id, 'quantity': 1}]}
        res = self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'product_out_of_stock')

    def test_out_of_stock_no_order_created(self):
        from .models import Order
        oos = make_product(name='OOS2', slug='oos-order2', in_stock=False, stock_quantity=0)
        payload = {'delivery_address': 'Addr1', 'items': [{'product_id': oos.id, 'quantity': 1}]}
        self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(Order.objects.count(), 0)

    def test_quantity_exceeds_stock_returns_400(self):
        p = make_product(name='Partial', slug='partial-stock', price='9.99', stock_quantity=2)
        payload = {'delivery_address': 'Addr1', 'items': [{'product_id': p.id, 'quantity': 5}]}
        res = self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'product_out_of_stock')


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderAtomicTests(TestCase):
    """Verifies the transaction is all-or-nothing — partial order creation is impossible."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_no_partial_order_if_second_item_out_of_stock(self):
        from .models import Order
        good = make_product(name='Good', slug='good-atomic', price='9.99', stock_quantity=5)
        oos = make_product(name='OOS', slug='oos-atomic', in_stock=False, stock_quantity=0)
        payload = {
            'delivery_address': 'Addr1',
            'items': [
                {'product_id': good.id, 'quantity': 1},
                {'product_id': oos.id, 'quantity': 1},
            ],
        }
        res = self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        good.refresh_from_db()
        self.assertEqual(good.stock_quantity, 5)  # not decremented
