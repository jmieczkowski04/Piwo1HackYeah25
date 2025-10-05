from django.urls import path
from .views import login_view, get_id_by_pesel_view, register_view, register_page, login_page, user_data_by_id, get_user_id_from_token

urlpatterns = [
    path('', login_page, name='login_page'),
    path('login/', login_view, name='login'),
    path('get_id_by_pesel/', get_id_by_pesel_view, name='get_id_by_pesel'),
    path('register/', register_view, name='register'),
    path('register_page/', register_page, name='register_page'),
    path('login_page/', login_page, name='login_page'),
    path('get_data/', user_data_by_id, name='user_data_by_id'),
    path('get_user_id/', get_user_id_from_token, name='get_user_id')
]
