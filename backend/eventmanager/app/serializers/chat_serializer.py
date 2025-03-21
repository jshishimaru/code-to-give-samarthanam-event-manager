from rest_framework import serializers
from ..models import Chat
from .user_serializer import UserSerializer
from .task_serializer import TaskInfoSerializer

class ChatSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    task = TaskInfoSerializer(read_only=True)
    
    class Meta:
        model = Chat
        fields = ['id', 'user', 'task', 'text']
