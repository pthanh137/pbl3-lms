from rest_framework import serializers
from .models import Message, TypingIndicator, CourseGroup, GroupMessage, GroupMember
from users.serializers import UserSerializer
from users.models import User


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    course_id = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    sender_id = serializers.IntegerField(write_only=True, required=False)
    receiver_id = serializers.IntegerField(write_only=True)
    course_id_write = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'receiver',
            'course_id',
            'course_title',
            'sender_id',
            'receiver_id',
            'course_id_write',
            'content',
            'sent_at',
            'is_read',
        ]
        read_only_fields = ['id', 'sent_at', 'is_read']
    
    def get_course_id(self, obj):
        return obj.course.id if obj.course else None
    
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None
    
    def create(self, validated_data):
        """Create message with sender from request user."""
        sender_id = validated_data.pop('sender_id', None)
        receiver_id = validated_data.pop('receiver_id')
        course_id = validated_data.pop('course_id_write', None)
        
        # Get sender from request user
        request = self.context.get('request')
        if request and request.user:
            sender = request.user
        elif sender_id:
            from users.models import User
            sender = User.objects.get(id=sender_id)
        else:
            raise serializers.ValidationError("Sender must be authenticated or provided.")
        
        # Get receiver
        from users.models import User
        receiver = User.objects.get(id=receiver_id)
        
        # Get course if provided
        course = None
        if course_id:
            from courses.models import Course
            course = Course.objects.get(id=course_id)
        
        message = Message.objects.create(
            sender=sender,
            receiver=receiver,
            course=course,
            **validated_data
        )
        return message


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversation messages."""
    
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    course_id = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'receiver',
            'course_id',
            'course_title',
            'content',
            'sent_at',
            'is_read',
        ]
    
    def get_course_id(self, obj):
        return obj.course.id if obj.course else None
    
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None


class ConversationUserSerializer(serializers.Serializer):
    """Serializer for conversation user info."""
    id = serializers.IntegerField()
    full_name = serializers.CharField(allow_blank=True)
    avatar_url = serializers.CharField(allow_null=True, allow_blank=True)
    role = serializers.CharField()


class ConversationListSerializer(serializers.Serializer):
    """Serializer for conversation list item."""
    conversation_user = ConversationUserSerializer()
    last_message = serializers.JSONField(allow_null=True, required=False)
    last_message_time = serializers.DateTimeField(allow_null=True, required=False)
    unread_count_for_current_user = serializers.IntegerField()
    is_online = serializers.BooleanField(default=False, required=False)


class TypingIndicatorSerializer(serializers.ModelSerializer):
    """Serializer for typing indicator."""
    
    sender_id = serializers.IntegerField(write_only=True, required=False)
    receiver_id = serializers.IntegerField(write_only=True)
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    class Meta:
        model = TypingIndicator
        fields = [
            'id',
            'sender',
            'receiver',
            'sender_id',
            'receiver_id',
            'is_typing',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for CourseGroup."""
    
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    
    class Meta:
        model = CourseGroup
        fields = [
            'id',
            'name',
            'course_id',
            'members_count',
        ]
        read_only_fields = ['id', 'name', 'course_id', 'members_count']


class CourseGroupSerializer(serializers.ModelSerializer):
    """Serializer for CourseGroup (simplified for user groups list)."""
    
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseGroup
        fields = ['id', 'name', 'members_count', 'course_thumbnail']
    
    def get_course_thumbnail(self, obj):
        """Return course thumbnail URL."""
        if obj.course and obj.course.thumbnail_url:
            return obj.course.thumbnail_url
        return None


class GroupMessageSerializer(serializers.ModelSerializer):
    """Serializer for GroupMessage."""
    
    sender = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True, format='%Y-%m-%dT%H:%M:%S.%fZ')
    
    class Meta:
        model = GroupMessage
        fields = [
            'id',
            'content',
            'sender',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_sender(self, obj):
        """Return sender info with role."""
        # Get user's role in the group
        member = obj.group.members.filter(user=obj.sender).first()
        role = member.role if member else 'student'
        
        return {
            'id': obj.sender.id,
            'full_name': obj.sender.full_name or '',
            'avatar_url': obj.sender.avatar_url or None,
            'role': role,
        }


class GroupMemberUserSerializer(serializers.ModelSerializer):
    """Serializer for User in GroupMember context."""
    
    class Meta:
        model = User
        fields = ["id", "full_name", "email", "avatar_url", "role"]


class GroupMemberSerializer(serializers.ModelSerializer):
    """Serializer for GroupMember."""
    
    user = GroupMemberUserSerializer(read_only=True)
    
    class Meta:
        model = GroupMember
        fields = ["id", "user", "is_admin"]
