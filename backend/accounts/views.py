from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserProfileSerializer

REFRESH_COOKIE = 'refresh_token'
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60


def _rate_limit_response():
    return Response(
        {'error': 'Too many requests', 'code': 'rate_limit_exceeded', 'details': {}},
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


@method_decorator(ratelimit(key='ip', rate='6/m', method='POST', block=True), name='dispatch')
class RegisterView(APIView):
    permission_classes = []

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limit_response()

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'code': 'validation_error', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(ratelimit(key='ip', rate='6/m', method='POST', block=True), name='dispatch')
class LoginView(APIView):
    permission_classes = []

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limit_response()

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid credentials', 'code': 'invalid_credentials', 'details': {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        response = Response({'access_token': str(refresh.access_token)}, status=status.HTTP_200_OK)
        response.set_cookie(
            key=REFRESH_COOKIE,
            value=str(refresh),
            httponly=True,
            samesite='Lax',
            secure=False,
            max_age=REFRESH_COOKIE_MAX_AGE,
        )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie(REFRESH_COOKIE)
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {'error': 'Refresh token missing', 'code': 'refresh_token_missing', 'details': {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(refresh_token)
            return Response({'access_token': str(refresh.access_token)})
        except TokenError:
            return Response(
                {'error': 'Invalid or expired token', 'code': 'token_invalid', 'details': {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
