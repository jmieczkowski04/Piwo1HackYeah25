from .models import User

def verify_user(login, password):
    try:
        user = User.objects.get(login=login, password=password)
        return user
    except User.DoesNotExist:
        return None
    
def create_user(login, password, name, surname, pesel, email, phone_number):
    user = User(
        login=login,
        password=password,
        name=name,
        surname=surname,
        pesel=pesel,
        email=email,
        phone_number=phone_number
    )
    user.save()
    return user