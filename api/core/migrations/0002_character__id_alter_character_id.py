# Generated by Django 5.1.2 on 2025-01-15 01:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='_id',
            field=models.IntegerField(default=8159),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='character',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]
