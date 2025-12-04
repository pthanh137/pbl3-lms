from django.db import models
from django.conf import settings


class Message(models.Model):
    """Message model for user-to-user messaging."""
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='messages',
        help_text="Optional: message belongs to a course context"
    )
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'messages'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['sender', 'receiver']),
            models.Index(fields=['receiver', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.sender.email} -> {self.receiver.email} ({self.sent_at})"


class TypingIndicator(models.Model):
    """Model to track typing indicators between users."""
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='typing_indicators_sent'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='typing_indicators_received'
    )
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'typing_indicators'
        unique_together = ['sender', 'receiver']
        indexes = [
            models.Index(fields=['receiver', 'is_typing']),
        ]
    
    def __str__(self):
        status = "typing" if self.is_typing else "not typing"
        return f"{self.sender.email} -> {self.receiver.email} ({status})"


class CourseGroup(models.Model):
    """Group chat for a course."""
    
    course = models.OneToOneField(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='group',
        unique=True
    )
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'course_groups'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Group: {self.name}"


class GroupMember(models.Model):
    """Member of a course group."""
    
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    
    group = models.ForeignKey(
        CourseGroup,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_admin = models.BooleanField(default=False, help_text="Teacher = admin")
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'group_members'
        unique_together = ['group', 'user']
        indexes = [
            models.Index(fields=['group', 'user']),
        ]
    
    def __str__(self):
        return f"{self.user} in {self.group}"


class GroupMessage(models.Model):
    """Message in a course group chat."""
    
    group = models.ForeignKey(
        CourseGroup,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_messages_sent'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'group_messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['group', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.email} in {self.group.name}: {self.content[:50]}"
