from .models import User

def verify_user(login, password):
    try:
        user = models.User.objects.get(login=login, password=password)
        return user
    except models.User.DoesNotExist:
        return None