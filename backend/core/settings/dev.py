from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

CORS_ALLOWED_ORIGINS = ['http://localhost:3000']

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
