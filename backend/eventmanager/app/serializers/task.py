from rest_framework import serializers
from ..models import TaskInfo, User, EventInfo, SubTask

class TaskInfoSerializer(serializers.ModelSerializer):
    volunteer_names = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    subtask_count = serializers.SerializerMethodField()
    completed_subtasks = serializers.SerializerMethodField()
    skills_list = serializers.SerializerMethodField()

    class Meta:
        model = TaskInfo
        fields = '__all__'
    
    def get_volunteer_names(self, obj):
        return [volunteer.name for volunteer in obj.volunteers.all()]
    
    def get_event_name(self, obj):
        return obj.event.event_name if obj.event else None
        
    def get_subtask_count(self, obj):
        return obj.subtasks.count()
        
    def get_completed_subtasks(self, obj):
        return obj.subtasks.filter(status='Completed').count()
    
    def get_skills_list(self, obj):
    	return obj.get_skills_list()


class SubTaskSerializer(serializers.ModelSerializer):
    parent_task_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SubTask
        fields = '__all__'
    
    def get_parent_task_name(self, obj):
        return obj.parent_task.task_name if obj.parent_task else None


class SubTaskDetailSerializer(serializers.ModelSerializer):
    """More detailed serializer for subtasks with parent task info"""
    parent_task = TaskInfoSerializer(read_only=True)
    
    class Meta:
        model = SubTask
        fields = '__all__'


class TaskWithSubtasksSerializer(serializers.ModelSerializer):
    """Serializer that includes a task's subtasks"""
    volunteer_names = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    subtasks = SubTaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = TaskInfo
        fields = '__all__'
    
    def get_volunteer_names(self, obj):
        """Get names of all assigned volunteers"""
        return [volunteer.name for volunteer in obj.volunteers.all()]
    
    def get_event_name(self, obj):
        return obj.event.event_name if obj.event else None