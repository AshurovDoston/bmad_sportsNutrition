from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser

REGISTER_URL = '/api/v1/auth/register/'
LOGIN_URL = '/api/v1/auth/login/'
LOGOUT_URL = '/api/v1/auth/logout/'
REFRESH_URL = '/api/v1/auth/token/refresh/'


def make_user(phone='998901234567', password='testpass123', name='Test User'):
    return CustomUser.objects.create_user(phone=phone, password=password, name=name)


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_success(self):
        payload = {'name': 'Doston', 'phone': '998901234567', 'password': 'strongpass1'}
        res = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', res.data)
        self.assertIn('name', res.data)
        self.assertIn('phone', res.data)
        self.assertNotIn('password', res.data)
        self.assertEqual(res.data['phone'], payload['phone'])

    def test_register_duplicate_phone(self):
        make_user(phone='998901234567')
        payload = {'name': 'Another', 'phone': '998901234567', 'password': 'strongpass1'}
        res = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'validation_error')
        details_str = str(res.data['details'])
        self.assertIn('phone_already_registered', details_str)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def test_login_success(self):
        payload = {'phone': '998901234567', 'password': 'testpass123'}
        res = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', res.data)
        self.assertIn('refresh_token', res.cookies)
        self.assertTrue(res.cookies['refresh_token']['httponly'])

    def test_login_invalid_credentials(self):
        payload = {'phone': '998901234567', 'password': 'wrongpassword'}
        res = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data['code'], 'invalid_credentials')


class LogoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def test_logout_clears_cookie(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['refresh_token'] = str(refresh)
        self.client.force_authenticate(user=self.user)
        res = self.client.post(LOGOUT_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('refresh_token', res.cookies)
        self.assertEqual(res.cookies['refresh_token'].value, '')

    def test_logout_requires_auth(self):
        res = self.client.post(LOGOUT_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenRefreshTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def test_token_refresh_success(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['refresh_token'] = str(refresh)
        res = self.client.post(REFRESH_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', res.data)

    def test_token_refresh_missing_cookie(self):
        res = self.client.post(REFRESH_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data['code'], 'refresh_token_missing')

    def test_token_refresh_invalid_token(self):
        self.client.cookies['refresh_token'] = 'invalid.token.value'
        res = self.client.post(REFRESH_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data['code'], 'token_invalid')
