from django.shortcuts import render
from django.http import JsonResponse
import json

def attach_token_view(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
    data = json.loads(request.body)
    refresh_token = data.get('refresh_token')
    access_token = data.get('access_token')
    if refresh_token is None or access_token is None:
        return JsonResponse({'error': 'Missing tokens'}, status=400)
    
    return JsonResponse({'refresh_token': refresh_token, 'access_token': access_token}, status=200)

