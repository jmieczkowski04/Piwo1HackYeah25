from django.contrib import admin
from .models import User



@admin.register(User)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('login', 'email', 'pesel')
    search_fields = ('login', 'email', 'pesel')         

