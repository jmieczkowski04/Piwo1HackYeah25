# api/specjal_serializers.py
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from django.db.models import Prefetch
from rest_framework import serializers

from .models import Group, Task, TaskAssignment


def _to_iso(value: Optional[str]) -> Optional[str]:
    """
    Zwraca ISO 8601 dla przekazanego stringa/datetimy.
    Zakładamy, że w JSON-ie dates przechowujesz ISO stringi.
    """
    if value is None:
        return None
    # Jeśli to już ISO string, po prostu zwracamy
    try:
        # Spróbuj sparsować — jeśli się uda, zwróć znormalizowane ISO z 'Z'
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except Exception:
        # Nie parsujemy na siłę — zwróć jak jest (frontend i tak przyjmie ISO)
        return str(value)


def _status_from_dates(start_iso: Optional[str], end_iso: Optional[str]) -> str:
    """
    FINISHED jeżeli koniec w przeszłości, w przeciwnym razie CONFIRMED.
    """
    if end_iso:
        try:
            end_dt = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            return "FINISHED" if end_dt < now else "CONFIRMED"
        except Exception:
            pass
    return "CONFIRMED"


class TaskUserSerializer(serializers.Serializer):
    id = serializers.CharField()

    @staticmethod
    def from_assignment(ass: TaskAssignment) -> Dict[str, Any]:
        return {"id": f"u-{ass.user_id}"}


class TaskSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    start_date = serializers.CharField(allow_null=True)
    end_date = serializers.CharField(allow_null=True)
    users = TaskUserSerializer(many=True)

    @staticmethod
    def from_model(task: Task, assignments: List[TaskAssignment]) -> Dict[str, Any]:
        dates = task.dates or {}
        start_iso = _to_iso(dates.get("start"))
        end_iso = _to_iso(dates.get("end"))
        return {
            "id": f"tsk-{task.task_id}",
            "name": task.name,
            "start_date": start_iso,
            "end_date": end_iso,
            "users": [TaskUserSerializer.from_assignment(a) for a in assignments if a.task_id == task.task_id],
        }


class GroupNodeSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    tasks = TaskSerializer(many=True)

    @staticmethod
    def from_model(group: Group, tasks: List[Task], task_assignments: List[TaskAssignment]) -> Dict[str, Any]:
        group_tasks = [t for t in tasks if t.group_id == group.group_id]
        return {
            "id": f"grp-{group.group_id}",
            "name": group.name,
            "tasks": [
                TaskSerializer.from_model(t, task_assignments)
                for t in group_tasks
            ],
        }


class EventLikeSerializer(serializers.Serializer):
    """
    Serializer „eventu” na bazie top-level Group (parent_group_id is NULL).
    Zwraca strukturę 1:1 jak w mockEventsForUser().
    """
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    institution_id = serializers.CharField()
    start_date = serializers.CharField(allow_null=True)
    end_date = serializers.CharField(allow_null=True)
    groups = GroupNodeSerializer(many=True)

    @staticmethod
    def from_model(
        event_group: Group,
        child_groups: List[Group],
        tasks: List[Task],
        task_assignments: List[TaskAssignment],
    ) -> Dict[str, Any]:
        dates = event_group.dates or {}
        start_iso = _to_iso(dates.get("start"))
        end_iso = _to_iso(dates.get("end"))
        status = _status_from_dates(start_iso, end_iso)

        children = [g for g in child_groups if g.parent_group_id == event_group.group_id]

        return {
            "id": f"evt-{event_group.group_id}",
            "name": event_group.name,
            "description": event_group.desc or "",
            "status": status,
            "institution_id": f"inst-{event_group.institution_id}" if isinstance(event_group.institution_id, int) else str(event_group.institution_id),
            "start_date": start_iso,
            "end_date": end_iso,
            "groups": [
                GroupNodeSerializer.from_model(child, tasks, task_assignments)
                for child in children
            ],
        }


def fetch_calendar_payload() -> List[Dict[str, Any]]:
    """
    Buduje listę eventów (top-level groups) wraz z podgrupami, taskami i userami.
    Zwraca gotowy payload do frontendu (format jak w mockEventsForUser()).
    """
    # Top-level „eventy”
    top_groups = list(Group.objects.filter(parent_group_id__isnull=True))

    # Podgrupy (dzieci)
    child_groups = list(Group.objects.filter(parent_group_id__isnull=False))

    # Wszystkie taski dla wszystkich grup z góry
    tasks = list(Task.objects.all())

    # Wszystkie assignmenty (dla mapowania users)
    assignments = list(TaskAssignment.objects.all())

    # Składamy
    result = [
        EventLikeSerializer.from_model(g, child_groups, tasks, assignments)
        for g in top_groups
    ]
    return result


# api/external_user_serializers.py
from rest_framework import serializers
from .models import ExternalUser

class ExternalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalUser
        fields = [
            "external_user_id",
            "pesel",
            "name",
            "surname",
            "agreement_file",
            "supervisor_id",
            "institution_id",
            "group_id",
            "is_accepted",
        ]
        read_only_fields = ["external_user_id", "institution_id", "group_id"]

class ExternalUserCreateSerializer(serializers.Serializer):
    # Pola przyjmowane w POST (minimalny, praktyczny zestaw)
    pesel = serializers.CharField(max_length=11)
    name = serializers.CharField(max_length=255)
    surname = serializers.CharField(max_length=255)
    supervisor_id = serializers.IntegerField(required=False, allow_null=True)
    is_accepted = serializers.BooleanField(required=False, default=False)
    # Jeśli chcesz uploadować plik jako base64:
    agreement_file_b64 = serializers.CharField(required=False, allow_blank=True)

    def to_model_kwargs(self):
        data = self.validated_data
        file_b64 = data.get("agreement_file_b64")
        file_bytes = None
        if file_b64:
            import base64
            try:
                file_bytes = base64.b64decode(file_b64)
            except Exception:
                file_bytes = None
        return {
            "pesel": data["pesel"],
            "name": data["name"],
            "surname": data["surname"],
            "supervisor_id": data.get("supervisor_id"),
            "is_accepted": data.get("is_accepted", False),
            "agreement_file": file_bytes,
        }
