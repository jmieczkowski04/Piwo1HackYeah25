from django.urls import path
from .views import login_view
from .views import get_id_by_pesel

urlpatterns = [
    path('login/', login_view, name='login'),
    path('get_id_by_pesel/', get_id_by_pesel, name='get_id_by_pesel'),
]