from django.db import models

# Create your models here.
from django.db import models

class User(models.Model):
    login = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)
    pesel = models.CharField(max_length=11, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name} {self.surname} ({self.login})"

