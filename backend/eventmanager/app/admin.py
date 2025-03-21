from django.contrib import admin
from .models import User, Host, EventInfo, TaskInfo, Feedback, Chat

# Register your models here.
admin.site.register(User)
admin.site.register(Host)
admin.site.register(EventInfo)
admin.site.register(TaskInfo)
admin.site.register(Feedback)
admin.site.register(Chat)