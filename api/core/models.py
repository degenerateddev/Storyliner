from django.db import models

class Character(models.Model):
    character_id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='avatars/')
    data = models.JSONField()

    def __str__(self):
        return self.text

class TextElement(models.Model):
    text_id = models.IntegerField(primary_key=True)
    data = models.JSONField()
    character = models.ForeignKey(Character, on_delete=models.CASCADE)

    def __str__(self):
        return self.text
    
class Section(models.Model):
    section_id = models.IntegerField(primary_key=True)
    texts = models.ManyToManyField(TextElement, blank=True)

    def __str__(self):
        return self.text

class Level(models.Model):
    level_id = models.IntegerField(primary_key=True)
    sections = models.ManyToManyField(Section, blank=True)

    def __str__(self):
        return self.text