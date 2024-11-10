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

# "Level" as Top Level
## Section as Sub Level
###### Add Characters into sections in the order of the stories' flow (one character can have multiple texts he works through during a section entry and one character can appear multiple times during a section with different text configurations) ######
###### Add Text Elements into Characters in the order of the stories' flow (one character can have multiple texts with multiple choices for the player) ######
# export as one file -> start with levels array, export as multiple -> one level per file
## export as JSON or XML
## save characters speaking into section but save sequences of multiple characters speaking right after each other in special section called "dialogue"
