from django.db import models
from django.conf import settings
import uuid

def upload_to(instance, filename):
    ext = filename.split('.')[-1]
    return f'json/{uuid.uuid4()}.{ext}'

class Character(models.Model):
    _id = models.IntegerField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    meta = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.name

class JSON(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    json = models.JSONField()

    def __str__(self):
        return str(self.id)