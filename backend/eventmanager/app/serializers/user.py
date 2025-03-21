from rest_framework import serializers
from ..models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'contact', 'skills', 'age', 'location', 
                 'organization', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }