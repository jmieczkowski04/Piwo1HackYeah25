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

# api/views.py (dopiski na końcu pliku)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Group, ExternalUser
from .specjal_serializers import (
    ExternalUserSerializer,
    ExternalUserCreateSerializer,
)

def _get_event_and_group_or_404(event_id: int, group_id: int):
    """
    Pomocniczo: pobiera event (top-level group) i jego dziecko (group_id).
    Rzuca 404 poprzez zwrot (None, Response) jeśli coś nie gra.
    """
    try:
        event_group = Group.objects.get(group_id=event_id, parent_group_id__isnull=True)
    except Group.DoesNotExist:
        return None, None, Response({"detail": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        group = Group.objects.get(group_id=group_id, parent_group_id=event_id)
    except Group.DoesNotExist:
        return None, None, Response({"detail": "Group not found or does not belong to the event"}, status=status.HTTP_404_NOT_FOUND)

    return event_group, group, None

@api_view(["POST"])
@permission_classes([AllowAny])
def external_user_create(request, event_id: int, group_id: int):
    """
    POST /volcon/event/<event_id>/group/<group_id>/external_user

    Body (JSON):
    {
      "pesel": "12345678901",
      "name": "Jan",
      "surname": "Kowalski",
      "supervisor_id": 5,          # opcjonalne
      "is_accepted": false,         # opcjonalne
      "agreement_file_b64": "..."   # opcjonalne (base64)
    }
    """
    event_group, group, error = _get_event_and_group_or_404(event_id, group_id)
    if error:
        return error

    serializer = ExternalUserCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    kwargs = serializer.to_model_kwargs()
    # Ustal institution_id na podstawie eventu (spójność z modelem)
    kwargs["institution_id"] = event_group.institution_id
    kwargs["group_id"] = group.group_id

    ext_user = ExternalUser.objects.create(**kwargs)
    return Response(ExternalUserSerializer(ext_user).data, status=status.HTTP_201_CREATED)

@api_view(["GET", "DELETE"])
@permission_classes([AllowAny])
def external_user_detail_or_delete(request, event_id: int, group_id: int, external_user_id: int):
    """
    GET    /volcon/event/<event_id>/group/<group_id>/external_user/<external_user_id>
    DELETE /volcon/event/<event_id>/group/<group_id>/external_user/<external_user_id>
    """
    event_group, group, error = _get_event_and_group_or_404(event_id, group_id)
    if error:
        return error

    try:
        ext_user = ExternalUser.objects.get(
            external_user_id=external_user_id,
            group_id=group.group_id,
            institution_id=event_group.institution_id,
        )
    except ExternalUser.DoesNotExist:
        return Response({"detail": "External user not found in this group/event"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(ExternalUserSerializer(ext_user).data, status=status.HTTP_200_OK)

    # DELETE
    ext_user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


