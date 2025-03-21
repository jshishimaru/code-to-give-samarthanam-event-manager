from rest_framework import serializers
from ..models import Host

class HostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Host
        fields = ['id', 'name', 'email', 'contact', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }