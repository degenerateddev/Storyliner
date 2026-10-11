from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CharacterViewSet, JSONViewSet

router = DefaultRouter()
router.register(r"json", JSONViewSet, basename="json")
router.register(r"characters", CharacterViewSet, basename="characters")

urlpatterns = [
    path("", include(router.urls)),
]
