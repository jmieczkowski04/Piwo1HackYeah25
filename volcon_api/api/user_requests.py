from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

mock_database_aaa = {
    "data": [
    {
        "id": "2137",
        "coordinates": {
            "lat": "10",
            "lng": "10"
        },
        "events": [
            {
            "id": "2222"
            }
        ],
        "opinions": [
            {
            "id": "3333"
            }
        ]
    },
    {
        "id": "213",
        "coordinates": {
            "lat": "10",
            "lng": "10"
        },
        "events": [
            {
            "id": "2222"
            }
        ],
        "opinions": [
            {
            "id": "3333"
            }
        ]
    }
]
}

def get_user_by_id(id):
    for user in mock_database_aaa["data"]:
        if user["id"] == id:
            return user
    print("here")
    return None

def get_all_users(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    return JsonResponse(mock_database_aaa, status=200)

def get_user_data(request, id):
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
    user_data = get_user_by_id(str(id))

    if user_data is None:
        return JsonResponse({"error": "user does not exist"}, status=404)
    
    return JsonResponse(user_data, status=200)

@csrf_exempt
def get_set_user_coordinates(request, id):
    if request.method != 'POST' and request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
    user_data = get_user_by_id(str(id))

    if user_data is None:
        return JsonResponse({"error": "user does not exist"}, status=404)
    
    if request.method == 'POST':
        user_data["coordinates"]["lat"] = request.POST.get('lat')
        user_data["coordinates"]["lng"] = request.POST.get('lng')
        return JsonResponse({}, status=200)
    
    return JsonResponse({"lat": user_data["coordinates"]["lat"], "lng": user_data["coordinates"]["lng"]}, status=200)
