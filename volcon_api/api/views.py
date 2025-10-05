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

def search_event(request):
    if request.method != 'POST':
        return JsonResponse({"error": "unsupported request method"}, status=403)
    
    title = request.POST.get('title')
    root_group_id = request.POST.get('root_group_id')
    startdate = request.POST.get('startdate')
    enddate = request.POST.get('enddate')
    radius = request.POST.get('radius')
    minimal_age = request.POST.get('minimalAge')
    loc = request.POST.get('_loc')

    filter = []
    if root_group_id is not None:
        filter.append(f"root_group_id:={root_group_id}")

    if startdate is not None:
        filter.append(f"startdate>={startdate}")

    if enddate is not None:
        filter.append(f"enddate<={enddate}")
    
    if radius is not None and loc is not None:
        filter.append(f"location({loc[0]}, {loc[1]}, {radius})")
    
    if minimal_age is not None:
        filter.append(f"minimal_age>={minimal_age}")

    event_data = {
        'q': title,
        'query_by': 'title',
        'filter_by': filter                                
    }

