from django.contrib import admin
from django.urls import path
from todos import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', views.health),
    path('todos', views.get_todos),
    path('add', views.add_todo),
]