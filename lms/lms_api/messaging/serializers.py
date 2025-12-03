from rest_framework import serializers
from .models import Message, TypingIndicator
from users.serializers import UserSerializer


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
