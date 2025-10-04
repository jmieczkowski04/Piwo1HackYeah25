from .models import User

def verify_user(login, password):
    try:
        user = User.objects.get(login=login, password=password)
        return user
    except User.DoesNotExist:
        return None