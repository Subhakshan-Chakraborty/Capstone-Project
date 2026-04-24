from django.http import JsonResponse
from .models import Todo
import json
from django.views.decorators.csrf import csrf_exempt

def health(request):
    return JsonResponse({"status": "healthy"})

@csrf_exempt
def todos(request):
    if request.method == "GET":
        todos = Todo.objects.all()

        data = []
        for t in todos:
            data.append({
                "id": t.id,
                "title": t.title,
                "completed": bool(t.completed)   # ✅ FORCE BOOLEAN
            })

        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        body = json.loads(request.body)

        todo = Todo.objects.create(
            title=body.get("title"),
            completed=bool(body.get("completed", False))  # ✅ ENSURE BOOLEAN
        )

        return JsonResponse({"message": "Todo added"})