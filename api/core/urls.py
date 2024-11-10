# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TextElementViewSet, SectionViewSet, LevelViewSet, CharacterViewSet

router = DefaultRouter()
router.register(r'texts', TextElementViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'levels', LevelViewSet)
router.register(r'characters', CharacterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]