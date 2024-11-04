from django.db import models

class Text(models.Model):
    content = models.CharField(max_length=5000)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Dialogue(Text):
    pass

class Repetitive(Text):
    pass