from django.urls import path
from .views import login_view, get_id_by_pesel_view, register_view

urlpatterns = [
    path('login/', login_view, name='login'),
    path('get_id_by_pesel/', get_id_by_pesel_view, name='get_id_by_pesel'),
    path('register/', register_view, name='register'),
]