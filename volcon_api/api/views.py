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


# api/views.py (dopisz poniżej istniejących importów)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Group, Task, TaskAssignment
from .specjal_serializers import EventLikeSerializer

@api_view(["GET"])
@permission_classes([AllowAny])
def event_detail(request, id: int):
    """
    Zwraca pojedynczy event (top-level Group o group_id==id) w formacie mockEventsForUser().
    """
    # 1) pobierz top-level group jako "event"
    try:
        event_group = Group.objects.get(group_id=id, parent_group_id__isnull=True)
    except Group.DoesNotExist:
        return Response({"detail": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

    # 2) podgrupy (dzieci) tego eventu
    child_groups = list(Group.objects.filter(parent_group_id=event_group.group_id))

    # 3) id wszystkich grup, dla których potrzebujemy tasków
    group_ids = [g.group_id for g in child_groups]

    # 4) taski tylko dla tych grup
    tasks = list(Task.objects.filter(group_id__in=group_ids))

    # 5) assignmenty tylko dla tych tasków
    task_ids = [t.task_id for t in tasks]
    assignments = list(TaskAssignment.objects.filter(task_id__in=task_ids))

    # 6) zbuduj payload dokładnie jak w mockEventsForUser()
    payload = EventLikeSerializer.from_model(
        event_group=event_group,
        child_groups=child_groups,
        tasks=tasks,
        task_assignments=assignments,
    )

    return Response(payload, status=200)

