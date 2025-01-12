from rest_framework import serializers
from .models import Character, JSON

class JSONSerializer(serializers.ModelSerializer):
    json = serializers.SerializerMethodField()
    
    class Meta:
        model = JSON
        fields = ("id", "json",)
    
    def get_json(self, obj):
        if obj.json:
            with obj.json.open('r') as file:
                return file.read()
            
        return None

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = '__all__'