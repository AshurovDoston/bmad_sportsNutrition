from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.mail import send_mail
from products.models import Product
from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartMergeItemSerializer, OrderCreateSerializer, OrderResponseSerializer


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


class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delivery_address = serializer.validated_data['delivery_address']
        items_data = serializer.validated_data['items']
        product_ids = [item['product_id'] for item in items_data]

        with transaction.atomic():
            # SELECT FOR UPDATE prevents race conditions between concurrent checkouts
            products = {
                p.id: p
                for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # Validate all products exist
            for item in items_data:
                if item['product_id'] not in products:
                    return Response(
                        {'error': 'Product not found', 'code': 'product_not_found', 'details': {}},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # Validate stock for all items before creating anything (AC: 4)
            for item in items_data:
                product = products[item['product_id']]
                if not product.is_in_stock or product.stock_quantity < item['quantity']:
                    return Response(
                        {'error': 'Product is out of stock', 'code': 'product_out_of_stock', 'details': {}},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Compute subtotal
            subtotal = sum(
                products[item['product_id']].price * item['quantity']
                for item in items_data
            )

            # Create Order (AC: 1)
            order = Order.objects.create(
                user=request.user,
                delivery_address=delivery_address,
                subtotal=subtotal,
            )

            # Create OrderItems and decrement stock (AC: 3)
            for item in items_data:
                product = products[item['product_id']]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_price=product.price,
                    quantity=item['quantity'],
                )
                product.stock_quantity = max(0, product.stock_quantity - item['quantity'])
                if product.stock_quantity == 0:
                    product.is_in_stock = False
                product.save(update_fields=['stock_quantity', 'is_in_stock'])

        # Send email outside transaction — email failure must not rollback order (AC: 5)
        _send_order_confirmation(order, request.user)

        return Response(
            OrderResponseSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


def _send_order_confirmation(order, user):
    item_lines = '\n'.join(
        f"  {item.product_name} × {item.quantity} — {item.product_price} UZS each"
        for item in order.items.all()
    )
    send_mail(
        subject=f"Order Confirmed: {order.order_number}",
        message=(
            f"Dear {user.name},\n\n"
            f"Your order {order.order_number} has been confirmed.\n\n"
            f"Items:\n{item_lines}\n\n"
            f"Subtotal: {order.subtotal} UZS\n"
            f"Delivery to: {order.delivery_address}\n\n"
            f"Thank you for shopping with us!"
        ),
        from_email='noreply@sportsnutrition.uz',
        recipient_list=[f"{user.phone}@demo.sportsnutrition.uz"],
        fail_silently=True,
    )
