from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .database import verify_user

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
            return JsonResponse({'message': "Sukces a teraz wypierdalaj not implemented"})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Only GET method allowed'}, status=400)
