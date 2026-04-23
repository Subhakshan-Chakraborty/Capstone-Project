from django.http import JsonResponse
from .models import Todo
import json
from django.views.decorators.csrf import csrf_exempt

def health(request):
    return JsonResponse({"status": "healthy-django"})

@csrf_exempt
def todos(request):
    if request.method == "GET":
        data = list(Todo.objects.values())
        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        print("RAW BODY:", request.body)

        body = json.loads(request.body)
        print("PARSED BODY:", body)

        todo = Todo.objects.create(
            title=body.get("title"),
            completed=body.get("completed", False)
        )

        print("CREATED TODO:", todo.id)

        return JsonResponse({"message": "Todo added (Django)"})