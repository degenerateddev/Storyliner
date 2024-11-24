from django.db import models
from django.conf import settings
import uuid

def upload_to(instance, filename):
    ext = filename.split('.')[-1]
    return f'dialogues/{uuid.uuid4()}.{ext}'

class Character(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='avatars/')
    meta = models.JSONField()

    def __str__(self):
        return self.name

class Dialogue(models.Model):
    id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    json = models.FileField(upload_to=upload_to)

    def __str__(self):
        return str(self.id)