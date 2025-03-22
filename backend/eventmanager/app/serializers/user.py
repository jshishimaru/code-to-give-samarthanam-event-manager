from rest_framework import serializers
from ..models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'contact', 'isHost', 'skills', 'age', 'location', 
                 'organization', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
        }
        read_only_fields = ['id', 'date_joined', 'last_login']

    def create(self, validated_data):
        # Extract password to use set_password method
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            instance.set_password(password)
        
        instance.save()
        return instance
    
    def update(self, instance, validated_data):
        # Handle password updates properly
        password = validated_data.pop('password', None)
        
        for key, value in validated_data.items():
            setattr(instance, key, value)
            
        if password is not None:
            instance.set_password(password)
            
        instance.save()
        return instance