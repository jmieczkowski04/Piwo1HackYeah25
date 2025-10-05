from django.shortcuts import render
from django.http import JsonResponse
import json

def get_userid_from_token(access_token):
    return "2137"

def attach_token_view(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
    refresh_token = request.GET.get('refresh_token')
    access_token = request.GET.get('access_token')
    if refresh_token is None or access_token is None:
        return JsonResponse({'error': 'Missing tokens'}, status=400)
    
    request.session["access_token"] = access_token
    request.session["refresh_token"] = refresh_token

    print(access_token)
    return JsonResponse({}, status=200)

def check_token(request):
    print(request.session["access_token"])