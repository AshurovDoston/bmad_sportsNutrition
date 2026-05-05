from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['name', 'phone', 'password']
        extra_kwargs = {
            'phone': {'validators': []},
        }

    def validate_phone(self, value):
        if CustomUser.objects.filter(phone=value).exists():
            raise serializers.ValidationError({
                'error': 'Phone already registered',
                'code': 'phone_already_registered',
                'details': {},
            })
        return value

    def create(self, validated_data):
        return CustomUser.objects.create_user(
            phone=validated_data['phone'],
            password=validated_data['password'],
            name=validated_data['name'],
        )


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'phone']
        read_only_fields = ['id', 'name', 'phone']


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(phone=data['phone'], password=data['password'])
        if not user:
            raise serializers.ValidationError({
                'error': 'Invalid credentials',
                'code': 'invalid_credentials',
                'details': {},
            })
        data['user'] = user
        return data
