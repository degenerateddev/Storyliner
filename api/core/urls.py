# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CharacterViewSet, DialogueViewSet

router = DefaultRouter()
router.register(r'dialogue', DialogueViewSet)
router.register(r'character', CharacterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]