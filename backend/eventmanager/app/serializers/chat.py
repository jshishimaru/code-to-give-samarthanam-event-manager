from rest_framework import serializers
from ..models import Chat, EventChat

class TaskChatSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_host = serializers.BooleanField(read_only=True)
    is_current_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = ['id', 'task', 'user', 'user_name', 'text', 'is_host', 'is_current_user', 'timestamp']
        read_only_fields = ['user', 'is_host', 'is_current_user', 'timestamp']
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_is_current_user(self, obj):
        """
        Check if the message was sent by the current user
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.user.id == request.user.id
        return False

class EventChatSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_host = serializers.BooleanField(read_only=True)
    is_current_user = serializers.SerializerMethodField()
    
    class Meta:
        model = EventChat
        fields = ['id', 'event', 'user', 'user_name', 'message', 'is_host', 'is_current_user', 'timestamp']
        read_only_fields = ['user', 'is_host', 'is_current_user', 'timestamp']
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_is_current_user(self, obj):
        """
        Check if the message was sent by the current user
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.user.id == request.user.id
        return False