from django.urls import path
from . import views
from .views import attach_token_view, check_token
from .user_requests import get_user_data, get_all_users, get_set_user_coordinates
from .views import attach_token_view, check_token, event_detail
from .views import external_user_create, external_user_detail_or_delete

urlpatterns = [
    path('attach_token/', attach_token_view, name='attach_token'),
    path('user/', get_all_users, name='user_detail'),
    path('user/<int:id>/', get_user_data, name='user_detail'),
    path('user/<int:id>/localization', get_set_user_coordinates, name='user_detail'),
    path('check/token', check_token, name='check_token'),

    path('event/<int:id>/', event_detail, name='event_detail'),
    
    path('event/<int:event_id>/group/<int:group_id>/external_user', external_user_create, name='external_user_create'),
    path('event/<int:event_id>/group/<int:group_id>/external_user/<int:external_user_id>', external_user_detail_or_delete, name='external_user_detail_or_delete'),
]
