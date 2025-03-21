from rest_framework import serializers
from ..models import Feedback
from .user_serializer import UserSerializer
from .event_serializer import EventInfoSerializer

class FeedbackSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventInfoSerializer(read_only=True)
    
    class Meta:
        model = Feedback
        fields = ['id', 'event', 'user', 'content']
