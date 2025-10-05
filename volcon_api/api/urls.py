from django.urls import path
from . import views
from .views import attach_token_view

urlpatterns = [
    path('attach_token/', attach_token_view, name='attach_token'),
]
