from rest_framework import serializers
from ..models import Chat, User, TaskInfo

class ChatSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    task_name = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = '__all__'
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_task_name(self, obj):
        return obj.task.task_name if obj.task else None
        
    def get_is_host(self, obj):
        return obj.user.isHost if obj.user else None