from rest_framework import serializers
from ..models import User

class HostSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'contact', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
        }
        read_only_fields = ['id', 'date_joined', 'last_login']
        
    def validate(self, data):
        # Ensure this serializer is only used for hosts
        data['isHost'] = True
        return data

    def create(self, validated_data):
        # Extract password to use set_password method
        password = validated_data.pop('password', None)
        validated_data['isHost'] = True  # Ensure this user is created as a host
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            instance.set_password(password)
        
        instance.save()
        return instance