from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from products.models import Product
from .models import Cart, CartItem
from .serializers import CartSerializer, CartMergeItemSerializer


def _cart_response(cart, request):
    cart.refresh_from_db()
    return Response(CartSerializer(cart, context={'request': request}).data)


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return _cart_response(cart, request)


class CartItemCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        product = get_object_or_404(Product, pk=product_id)
        if not product.is_in_stock:
            return Response(
                {'error': 'Product is out of stock', 'code': 'product_out_of_stock', 'details': {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += int(quantity)
        else:
            item.quantity = int(quantity)
        item.save()
        return _cart_response(cart, request)


class CartItemUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_item(self, request, pk):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return get_object_or_404(CartItem, pk=pk, cart=cart), cart

    def patch(self, request, pk):
        item, cart = self._get_item(request, pk)
        quantity = request.data.get('quantity')
        if quantity is not None:
            item.quantity = int(quantity)
            item.save()
        return _cart_response(cart, request)

    def delete(self, request, pk):
        item, cart = self._get_item(request, pk)
        item.delete()
        return _cart_response(cart, request)


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CartMergeItemSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        for entry in serializer.validated_data:
            try:
                product = Product.objects.get(pk=entry['product_id'])
            except Product.DoesNotExist:
                continue
            if not product.is_in_stock:
                continue
            item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            item.quantity = item.quantity + entry['quantity'] if not created else entry['quantity']
            item.save()
        return _cart_response(cart, request)
