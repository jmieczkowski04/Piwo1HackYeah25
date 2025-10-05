from django.contrib import admin

from .models import *

@admin.register(UserLocation)
class UserLocationAdmin(admin.ModelAdmin):
    list_display = ('usr_id', 'latitude', 'longitude')  
    search_fields = ('usr_id',)  

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('institution_id', 'is_confirmed', 'regon', 'is_company', 'id_user')  
    search_fields = ('regon', 'id_user')  
    list_filter = ('is_confirmed', 'is_company')

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('group_id', 'name', 'institution_id', 'is_confirmed')  
    search_fields = ('name', 'institution_id')  
    list_filter = ('is_confirmed',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('task_id', 'name', 'institution_id', 'group_id')  
    search_fields = ('name', 'institution_id', 'group_id')

@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ('task_id', 'user_id', 'group_id', 'institution_id')  
    search_fields = ('task_id', 'user_id', 'group_id', 'institution_id')

@admin.register(Privilege)
class PrivilegeAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'privilege')  
    search_fields = ('user_id',)

@admin.register(Opinion)
class OpinionAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'institution_id', 'rating')  
    search_fields = ('user_id', 'institution_id', 'rating')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('alert_id', 'user_id',)  
    search_fields = ('user_id', 'institution_id', 'message')

@admin.register(ExternalUser)
class ExternalUserAdmin(admin.ModelAdmin):
    list_display = ('external_user_id', 'name')  
    search_fields = ('name', 'email')

