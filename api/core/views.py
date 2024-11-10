from rest_framework import views, status, viewsets
from rest_framework.response import Response
from .models import TextElement, Section, Level, Character
from .serializers import TextElementSerializer, SectionSerializer, LevelSerializer, CharacterSerializer

from core.utils import parse

class TextElementViewSet(viewsets.ModelViewSet):
    queryset = TextElement.objects.all()
    serializer_class = TextElementSerializer

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class LevelViewSet(viewsets.ModelViewSet):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer

class CharacterViewSet(viewsets.ModelViewSet):
    queryset = Character.objects.all()
    serializer_class = CharacterSerializer
