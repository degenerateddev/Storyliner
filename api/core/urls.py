from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CharacterViewSet, ProjectViewSet

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="projects")

characters = CharacterViewSet.as_view({"get": "list", "post": "create"})
character = CharacterViewSet.as_view({"get": "retrieve", "delete": "destroy"})

urlpatterns = [
    path("", include(router.urls)),
    path("projects/<int:project_id>/characters/", characters, name="project-characters"),
    path("projects/<int:project_id>/characters/<str:_id>/", character, name="project-character"),
]
