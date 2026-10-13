from rest_framework import serializers

from .models import DEFAULT_PROJECT_NAME, Character, Project


def empty_story(name):
    return {"name": name, "graphs": [{"id": "D1", "name": "Dialogue 1", "sections": []}]}


def story_name(story):
    name = str(story.get("name") or "").strip()[:200]
    return name or DEFAULT_PROJECT_NAME


class ProjectListSerializer(serializers.ModelSerializer):
    dialogues = serializers.SerializerMethodField()
    characters = serializers.IntegerField(source="character_count", read_only=True)

    class Meta:
        model = Project
        fields = ("id", "name", "dialogues", "characters", "created_at", "updated_at")

    def get_dialogues(self, project):
        graphs = project.json.get("graphs") if isinstance(project.json, dict) else None
        # Stories from before dialogue graphs hold a single dialogue.
        return len(graphs) if isinstance(graphs, list) else 1


class ProjectSerializer(serializers.ModelSerializer):
    """`name` is only read when creating without a story; afterwards it follows `json.name`."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    json = serializers.JSONField(required=False)

    class Meta:
        model = Project
        fields = ("id", "user", "name", "json", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_json(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("A story must be a JSON object.")
        return value

    def validate(self, attrs):
        story = attrs.get("json")
        if story is None and self.instance is None:
            story = attrs["json"] = empty_story(story_name(attrs))
        if story is not None:
            attrs["name"] = story_name(story)
        else:
            attrs.pop("name", None)
        return attrs


class CharacterSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(max_length=64)
    meta = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Character
        fields = ("_id", "name", "meta")
        # Uniqueness per project is handled by the upsert in CharacterViewSet.create.
        validators = []
