from django.urls import path
from . import views
from .views import attach_token_view
from .user_requests import get_user_data, get_all_users, get_set_user_coordinates

urlpatterns = [
    path('attach_token/', attach_token_view, name='attach_token'),
    path('user/', get_all_users, name='user_detail'),
    path('user/<int:id>/', get_user_data, name='user_detail'),
    path('user/<int:id>/localization', get_set_user_coordinates, name='user_detail'),
]
