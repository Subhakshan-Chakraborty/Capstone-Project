from django.http import JsonResponse
from .models import Todo
import json

# Health check
def health(request):
    return JsonResponse({"status": "healthy-django"})

# Get todos
def get_todos(request):
    data = list(Todo.objects.values())
    return JsonResponse(data, safe=False)

# Add todo
def add_todo(request):
    if request.method == "POST":
        body = json.loads(request.body)
        Todo.objects.create(
            title=body.get("title"),
            completed=body.get("completed", False)
        )
        return JsonResponse({"message": "Todo added (Django)"})