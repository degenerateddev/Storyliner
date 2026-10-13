from django.conf import settings
from django.db import models

DEFAULT_PROJECT_NAME = "Untitled story"


class Project(models.Model):
    """A story of a user: its dialogue graphs (in `json`) and its characters."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    # Copied from `json["name"]` on every save so the project list does not need the graphs.
    name = models.CharField(max_length=200, default=DEFAULT_PROJECT_NAME)
    json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.user})"


class Character(models.Model):
    # Client-generated id (UUID) so the editor can reference characters before they are saved.
    _id = models.CharField(max_length=64)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="characters")
    name = models.CharField(max_length=100)
    meta = models.JSONField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "_id"], name="unique_character_per_project"),
        ]

    def __str__(self):
        return self.name
