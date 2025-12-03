from rest_framework import serializers
from .models import Notification
from courses.serializers import CourseSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    course = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'course',
            'notification_type',
            'target_url',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'is_read']
    
    def get_course(self, obj):
        """Return course info if exists."""
        if obj.course:
            return {
                'id': obj.course.id,
                'title': obj.course.title,
            }
        return None


class NotificationListSerializer(serializers.ModelSerializer):
    """Serializer for notification list (optimized)."""
    
    course = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'course',
            'notification_type',
            'target_url',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'is_read']
    
    def get_course(self, obj):
        """Return course info if exists."""
        if obj.course:
            return {
                'id': obj.course.id,
                'title': obj.course.title,
            }
        return None

