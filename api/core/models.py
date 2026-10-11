from django.conf import settings
from django.db import models


class Character(models.Model):
    # Client-generated id (UUID) so the editor can reference characters before they are saved.
    _id = models.CharField(max_length=64)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    meta = models.JSONField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "_id"], name="unique_character_per_user"),
        ]

    def __str__(self):
        return self.name


class JSON(models.Model):
    """The story graph of a user (one per user)."""

    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    json = models.JSONField()

    def __str__(self):
        return f"Story of {self.user}"
