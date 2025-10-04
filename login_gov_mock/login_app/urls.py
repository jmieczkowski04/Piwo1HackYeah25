from django.urls import path
from .views import login_view, get_id_by_pesel_view, register_view, register_page

urlpatterns = [
    path('login/', login_view, name='login'),
    path('get_id_by_pesel/', get_id_by_pesel_view, name='get_id_by_pesel'),
    path('register/', register_view, name='register'),
    path('register_page/', register_page, name='register_page')
]