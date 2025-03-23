from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User, EventInfo, TaskInfo, SubTask, Feedback, EventChat

class CustomUserCreationForm(UserCreationForm):
    """
    A form that creates a user, with no privileges, from the given email and password.
    """
    class Meta:
        model = User
        fields = ('email', 'name', 'contact', 'isHost')

class CustomUserChangeForm(UserChangeForm):
    """
    A form for updating users. Includes all fields, but replaces the password
    field with admin's password hash display field.
    """
    class Meta:
        model = User
        fields = ('email', 'password', 'name', 'contact', 'isHost', 'is_active', 'is_staff')

class CustomUserAdmin(UserAdmin):
    """Custom User Admin that uses proper password hashing"""
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    
    list_display = ('email', 'name', 'contact', 'isHost', 'is_staff')
    list_filter = ('isHost', 'is_staff', 'is_active')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'contact', 'skills', 'age', 'location', 'organization')}),
        ('Permissions', {'fields': ('isHost', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'contact', 'password1', 'password2', 'isHost'),
        }),
        ('Optional information', {
            'classes': ('collapse',),
            'fields': ('skills', 'age', 'location', 'organization'),
        }),
    )
    
    search_fields = ('email', 'name', 'contact')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)

from .models import Chat

class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user_name', 'get_task_name', 'truncated_text', 'is_host', 'timestamp')
    list_filter = ('is_host', 'timestamp', 'task')
    search_fields = ('user__name', 'task__task_name', 'text')
    readonly_fields = ('is_host', 'timestamp')
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else "Unknown"
    get_user_name.short_description = 'User'
    
    def get_task_name(self, obj):
        return obj.task.task_name if obj.task else "Unknown"
    get_task_name.short_description = 'Task'
    
    def truncated_text(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    truncated_text.short_description = 'Text'

admin.site.register(Chat, ChatAdmin)

# Register the custom admin class
admin.site.register(User, CustomUserAdmin)

# Register other models
admin.site.register(EventInfo)
admin.site.register(TaskInfo)
admin.site.register(SubTask)
admin.site.register(Feedback)
admin.site.register(EventChat)