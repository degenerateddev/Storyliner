from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def to_projects(apps, schema_editor):
    """Name every story after its JSON and move each user's characters into their (only) story."""
    Project = apps.get_model("core", "Project")
    Character = apps.get_model("core", "Character")

    for project in Project.objects.all():
        name = project.json.get("name") if isinstance(project.json, dict) else None
        project.name = str(name or "Untitled story")[:200]
        project.save(update_fields=["name"])

    for user_id in Character.objects.values_list("user_id", flat=True).distinct():
        project = Project.objects.filter(user_id=user_id).first()
        if project is None:
            story = {"name": "Untitled story", "graphs": [{"id": "D1", "name": "Dialogue 1", "sections": []}]}
            project = Project.objects.create(user_id=user_id, json=story)
        Character.objects.filter(user_id=user_id).update(project=project)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_character_uuid_story_autoid"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameModel("JSON", "Project"),
        migrations.AlterField(
            model_name="project",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="projects",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="name",
            field=models.CharField(default="Untitled story", max_length=200),
        ),
        migrations.AddField(
            model_name="project",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="project",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterModelOptions(name="project", options={"ordering": ["-updated_at"]}),
        migrations.AddField(
            model_name="character",
            name="project",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="characters",
                to="core.project",
            ),
        ),
        migrations.RunPython(to_projects, migrations.RunPython.noop),
        migrations.RemoveConstraint(model_name="character", name="unique_character_per_user"),
        migrations.RemoveField(model_name="character", name="user"),
        migrations.AlterField(
            model_name="character",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="characters",
                to="core.project",
            ),
        ),
        migrations.AddConstraint(
            model_name="character",
            constraint=models.UniqueConstraint(fields=("project", "_id"), name="unique_character_per_project"),
        ),
    ]
