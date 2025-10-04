from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .database import verify_user, create_user, is_user_unique
from .models import User


from django.shortcuts import render
from django.http import HttpRequest

@csrf_exempt 
def login_view(request):
    if request.method == 'GET':
        try:
            data = json.loads(request.body)
            login = data.get('login')
            password = data.get('password')
            if login is None or password is None:
                return JsonResponse({'error': f'You must give in body json containing login and password fields'}, status=400)
            
            user = verify_user(login, password)
            if user is None:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            # TODO: make a correct redirect to main backend
            return JsonResponse({'message': "Sukces a teraz wypierdalaj not implemented"}, status=301)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Only GET method allowed'}, status=400)
    

@csrf_exempt
def get_id_by_pesel_view(request):
    if request.method == 'GET':
        try:
            data = json.loads(request.body)
            pesel = data.get('pesel')
            if pesel is None:
                return JsonResponse({'error': f'You must give in body json containing pesel field'}, status=400)
            
            user = User.objects.filter(pesel=pesel).first()
            if user is None:
                return JsonResponse({'error': 'PESEL not found'}, status=404)
            
            return JsonResponse({'id': user.id})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Only GET method allowed'}, status=400)
    
@csrf_exempt
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['login', 'password', 'name', 'surname', 'pesel', 'email', 'phone_number']
            if not all(field in data for field in required_fields):
                return JsonResponse({'error': f'You must give in body json containing fields: {", ".join(required_fields)}'}, status=400)
            
            # Check if user with the same login or pesel already exists
            if not is_user_unique(data['login'], data['pesel'], data['email']):
                return JsonResponse({'error': 'User with this login or PESEL already exists'}, status=409)
            
            user = create_user(
                login=data['login'],
                password=data['password'],
                name=data['name'],
                surname=data['surname'],
                pesel=data['pesel'],
                email=data['email'],
                phone_number=data['phone_number']
            )
            
            return JsonResponse({'message': 'User registered successfully', 'user_id': user.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Only POST method allowed'}, status=400)



@csrf_exempt
def register_page(request):
    print('siur1')
    message = None
    print('siur2')
    if request.method == 'POST':
        print('siur3')
        # Pobierz dane z formularza
        data = {
            'login': request.POST.get('login'),
            'password': request.POST.get('password'),
            'name': request.POST.get('name'),
            'surname': request.POST.get('surname'),
            'pesel': request.POST.get('pesel'),
            'email': request.POST.get('email'),
            'phone_number': request.POST.get('phone_number'),
        }
        # Pakowanie do JSON i wysłanie do register_view
        class DummyRequest(HttpRequest):
            def __init__(self, data):
                super().__init__()
                self.method = 'POST'
                self._body = json.dumps(data).encode('utf-8')
            @property
            def body(self):
                return self._body
            
        

        dummy_request = DummyRequest(data)

        print(dummy_request.body)

        response = register_view(dummy_request)

        print(response)

        try:
            response_data = json.loads(response.content)
            print(response_data)
            print(response.status_code)
            if response.status_code == 201:
                message = f"Zarejestrowano! ID użytkownika: {response_data.get('user_id')}"
                return HttpResponse(message, content_type="text/plain")
            else:
                message = response_data.get('error', 'Błąd rejestracji')
                return HttpResponse(message, content_type="text/plain")
            
        except Exception:
            message = 'Błąd rejestracji.'
    print('siur4')
    return render(request, 'register.html', {'message': message})