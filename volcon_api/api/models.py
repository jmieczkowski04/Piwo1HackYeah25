from django.db import models

class UserLocation(models.Model):
    usr_id = models.IntegerField()
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return f"User {self.usr_id}: ({self.latitude}, {self.longitude})"

class Institution(models.Model):
    institution_id = models.AutoField(primary_key=True)
    is_confirmed = models.BooleanField(default=False)
    regon = models.CharField(max_length=14, blank=True, null=True, unique=True)
    is_company = models.BooleanField(default=False)
    id_user = models.IntegerField(blank=True, null=True)

    def __str__(self):
        if self.is_company and self.regon:
            return f"Firma REGON: {self.regon} (potwierdzona: {self.is_confirmed})"
        elif self.id_user:
            return f"Osoba ID: {self.id_user} (potwierdzona: {self.is_confirmed})"
        return f"Instytucja (potwierdzona: {self.is_confirmed})"

class Group(models.Model):
    institution_id = models.IntegerField()
    group_id = models.AutoField(primary_key=True)

    # sprawdzić czy to ma sens
    group_loc = models.ForeignKey(UserLocation, on_delete=models.SET_NULL, blank=True, null=True)
    
    desc = models.TextField(blank=True, null=True)
    parent_group_id = models.IntegerField(blank=True, null=True)
    name = models.CharField(max_length=255)
    is_confirmed = models.BooleanField(default=False)
    dates = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} (ID: {self.group_id})"

class Task(models.Model):
    institution_id = models.IntegerField()
    group_id = models.IntegerField()
    task_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    desc = models.TextField(blank=True, null=True)
    dates = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} (ID: {self.task_id})"

class TaskAssignment(models.Model):
    institution_id = models.IntegerField()
    group_id = models.IntegerField()
    task_id = models.IntegerField()
    user_id = models.IntegerField()

    def __str__(self):
        return f"Task {self.task_id} assigned to User {self.user_id} (Group {self.group_id}, Institution {self.institution_id})"

# poprawic primary keys itp
class Privilege(models.Model):
    user_id = models.IntegerField()
    privilege_id = models.AutoField(primary_key=True)
    institution_id = models.IntegerField()
    group_id = models.IntegerField()
    privilege = models.JSONField()

    def __str__(self):
        return f"Privilege {self.privilege_id} for User {self.user_id} (Institution {self.institution_id}, Group {self.group_id})"

class Opinion(models.Model):
    institution_id = models.IntegerField()
    group_id = models.IntegerField()
    user_id = models.IntegerField()
    author_id = models.IntegerField()
    desc = models.TextField()

    def __str__(self):
        return f"Opinia o użytkowniku {self.user_id} (autor: {self.author_id}, instytucja: {self.institution_id}, grupa: {self.group_id})"



