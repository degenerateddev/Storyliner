from rest_framework import serializers
from .models import TextElement, Section, Level, Character

class TextElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextElement
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    texts = TextElementSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = '__all__'

class LevelSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Level
        fields = '__all__'

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = '__all__'