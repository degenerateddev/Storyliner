from rest_framework import serializers

from .models import Character, JSON


class JSONSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = JSON
        fields = ("id", "user", "json")
        read_only_fields = ("id",)


class CharacterSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(max_length=64)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    meta = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Character
        fields = ("_id", "user", "name", "meta")
        # Uniqueness per user is handled by the upsert in CharacterViewSet.create.
        validators = []
