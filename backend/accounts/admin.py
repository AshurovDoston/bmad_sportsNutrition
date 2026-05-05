from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['phone', 'name', 'is_staff', 'date_joined']
    ordering = ['phone']
    search_fields = ['phone', 'name']
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('Personal', {'fields': ('name', 'delivery_address')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'fields': ('phone', 'name', 'password1', 'password2')}),
    )
