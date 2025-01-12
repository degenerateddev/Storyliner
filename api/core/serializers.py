from rest_framework import serializers
from .models import Character, JSON

class JSONSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    json = serializers.JSONField()
    
    class Meta:
        model = JSON
        fields = '__all__'

class CharacterSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    name = serializers.CharField()
    avatar = serializers.ImageField()
    meta = serializers.JSONField()

    class Meta:
        model = Character
        fields = '__all__'