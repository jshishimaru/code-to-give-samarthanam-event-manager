# Generated by Django 5.1.1 on 2025-03-23 09:31

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_alter_eventinfo_host_alter_user_options_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='taskinfo',
            name='volunteer',
        ),
        migrations.AddField(
            model_name='taskinfo',
            name='completion_notified',
            field=models.BooleanField(default=False, help_text='Indicates if volunteers have notified that the task is completed'),
        ),
        migrations.AddField(
            model_name='taskinfo',
            name='notification_message',
            field=models.TextField(blank=True, help_text='Message from volunteers about task completion'),
        ),
        migrations.AddField(
            model_name='taskinfo',
            name='notification_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='taskinfo',
            name='volunteers',
            field=models.ManyToManyField(blank=True, limit_choices_to={'isHost': False}, related_name='assigned_tasks', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='SubTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('status', models.CharField(choices=[('Pending', 'Pending'), ('In Progress', 'In Progress'), ('Completed', 'Completed')], default='Pending', max_length=50)),
                ('completion_notified', models.BooleanField(default=False, help_text='Indicates if volunteers have notified that the subtask is completed')),
                ('notification_message', models.TextField(blank=True, help_text='Message from volunteers about subtask completion')),
                ('notification_time', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent_task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subtasks', to='app.taskinfo')),
            ],
            options={
                'ordering': ['start_time'],
            },
        ),
    ]
