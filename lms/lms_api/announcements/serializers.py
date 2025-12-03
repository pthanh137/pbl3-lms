from rest_framework import serializers
from django.db.models import Count, Q
from .models import Announcement, AnnouncementReadStatus
from users.serializers import UserSerializer
from courses.serializers import CourseSerializer
from enrollments.models import Enrollment


class AnnouncementReadStatusSerializer(serializers.ModelSerializer):
    """Serializer for AnnouncementReadStatus."""
    
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    
    class Meta:
        model = AnnouncementReadStatus
        fields = ['id', 'student', 'student_name', 'student_email', 'is_read', 'read_at']
        read_only_fields = ['id', 'read_at']
    
    def get_student_name(self, obj):
        return obj.student.full_name or obj.student.email
    
    def get_student_email(self, obj):
        return obj.student.email


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for Announcement model."""
    
    teacher = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    is_read = serializers.SerializerMethodField()
    read_status_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'course',
            'teacher',
            'title',
            'message',
            'created_at',
            'is_read',
            'read_status_id',
        ]
        read_only_fields = ['id', 'created_at', 'teacher', 'course', 'is_read', 'read_status_id']
    
    def get_teacher(self, obj):
        """Return teacher info: id, full_name, avatar_url."""
        teacher = obj.teacher
        return {
            'id': teacher.id,
            'full_name': teacher.full_name or teacher.email,
            'avatar_url': teacher.avatar_url or None,
        }
    
    def get_course(self, obj):
        """Return course info: id, title."""
        course = obj.course
        return {
            'id': course.id,
            'title': course.title,
        }
    
    def get_is_read(self, obj):
        """Check if current user has read this announcement."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'student':
                try:
                    read_status = AnnouncementReadStatus.objects.get(
                        announcement=obj,
                        student=request.user
                    )
                    return read_status.is_read
                except AnnouncementReadStatus.DoesNotExist:
                    return False
        return None
    
    def get_read_status_id(self, obj):
        """Get read status ID for current user."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'student':
                try:
                    read_status = AnnouncementReadStatus.objects.get(
                        announcement=obj,
                        student=request.user
                    )
                    return read_status.id
                except AnnouncementReadStatus.DoesNotExist:
                    return None
        return None


class AnnouncementListSerializer(serializers.ModelSerializer):
    """Serializer for announcement list (shortened message)."""
    
    course = serializers.SerializerMethodField()
    message_preview = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'course',
            'title',
            'message_preview',
            'created_at',
            'is_read',
        ]
        read_only_fields = ['id', 'created_at', 'is_read']
    
    def get_course(self, obj):
        """Return course info: id, title."""
        course = obj.course
        return {
            'id': course.id,
            'title': course.title,
        }
    
    def get_message_preview(self, obj):
        """Return shortened message (first 150 characters)."""
        if obj.message:
            return obj.message[:150] + ('...' if len(obj.message) > 150 else '')
        return ''
    
    def get_is_read(self, obj):
        """Check if current user has read this announcement."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'student':
                try:
                    read_status = AnnouncementReadStatus.objects.get(
                        announcement=obj,
                        student=request.user
                    )
                    return read_status.is_read
                except AnnouncementReadStatus.DoesNotExist:
                    return False
        return None


class AnnouncementSentSerializer(serializers.ModelSerializer):
    """Serializer for teacher's sent announcements with stats."""
    
    course = serializers.SerializerMethodField()
    message_preview = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    total_students_enrolled = serializers.SerializerMethodField()
    total_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'course',
            'title',
            'message_preview',
            'created_at',
            'total_students_enrolled',
            'total_read',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_course(self, obj):
        """Return course info: id, title."""
        course = obj.course
        return {
            'id': course.id,
            'title': course.title,
        }
    
    def get_message_preview(self, obj):
        """Return shortened message (first 150 characters)."""
        if obj.message:
            return obj.message[:150] + ('...' if len(obj.message) > 150 else '')
        return ''
    
    def get_total_students_enrolled(self, obj):
        """Get total number of students enrolled in the course."""
        return Enrollment.objects.filter(course=obj.course).count()
    
    def get_total_read(self, obj):
        """Get total number of students who read the announcement."""
        return AnnouncementReadStatus.objects.filter(
            announcement=obj,
            is_read=True
        ).count()


class AnnouncementDetailSerializer(serializers.ModelSerializer):
    """Serializer for announcement detail with read statistics."""
    
    teacher = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    read_statistics = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    read_status_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'course',
            'teacher',
            'title',
            'message',
            'created_at',
            'read_statistics',
            'is_read',
            'read_status_id',
        ]
        read_only_fields = ['id', 'created_at', 'teacher', 'course', 'read_statistics', 'is_read', 'read_status_id']
    
    def get_teacher(self, obj):
        """Return teacher info: id, full_name, avatar_url."""
        teacher = obj.teacher
        return {
            'id': teacher.id,
            'full_name': teacher.full_name or teacher.email,
            'avatar_url': teacher.avatar_url or None,
        }
    
    def get_course(self, obj):
        """Return course info: id, title."""
        course = obj.course
        return {
            'id': course.id,
            'title': course.title,
        }
    
    def get_read_statistics(self, obj):
        """Get read statistics for the announcement."""
        total_students = Enrollment.objects.filter(course=obj.course).count()
        read_count = AnnouncementReadStatus.objects.filter(
            announcement=obj,
            is_read=True
        ).count()
        unread_count = total_students - read_count
        
        return {
            'read_count': read_count,
            'unread_count': unread_count,
            'total': total_students,
        }
    
    def get_is_read(self, obj):
        """Check if current user has read this announcement."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'student':
                try:
                    read_status = AnnouncementReadStatus.objects.get(
                        announcement=obj,
                        student=request.user
                    )
                    return read_status.is_read
                except AnnouncementReadStatus.DoesNotExist:
                    return False
        return None
    
    def get_read_status_id(self, obj):
        """Get read status ID for current user."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'student':
                try:
                    read_status = AnnouncementReadStatus.objects.get(
                        announcement=obj,
                        student=request.user
                    )
                    return read_status.id
                except AnnouncementReadStatus.DoesNotExist:
                    return None
        return None


# Removed: AnnouncementCreateSerializer - manual announcement sending no longer available
