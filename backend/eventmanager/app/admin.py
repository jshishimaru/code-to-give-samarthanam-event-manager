from django.contrib import admin
from .models import User, EventInfo, TaskInfo, Feedback, Chat , SubTask

# Register your models here.
admin.site.register(User)
admin.site.register(EventInfo)
admin.site.register(TaskInfo)
admin.site.register(Feedback)
admin.site.register(Chat)
admin.site.register(SubTask)
