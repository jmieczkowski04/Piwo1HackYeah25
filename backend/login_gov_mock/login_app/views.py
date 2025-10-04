from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .database import verify_user, create_user
from .models import User

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
            if User.objects.filter(login=data['login']).exists() or User.objects.filter(pesel=data['pesel']).exists():
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
