# Generated by Django 5.1.1 on 2025-03-21 18:56

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_alter_chat_options_remove_taskinfo_taskanalysis_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='eventinfo',
            name='points_for_volunteers',
        ),
        migrations.RemoveField(
            model_name='user',
            name='points',
        ),
    ]
