from rest_framework import serializers
from ..models import Feedback, User, EventInfo

class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = '__all__'
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_event_name(self, obj):
        return obj.event.event_name if obj.event else None
        
    def get_average_rating(self, obj):
        return obj.average_rating if hasattr(obj, 'average_rating') else None