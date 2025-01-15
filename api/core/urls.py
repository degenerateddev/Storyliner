# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CharacterViewSet, JSONViewSet

router = DefaultRouter()
router.register(r'json', JSONViewSet)
router.register(r'characters', CharacterViewSet, basename='characters')
router.register(r'character', CharacterViewSet, basename='character')

urlpatterns = [
    path('', include(router.urls)),
]