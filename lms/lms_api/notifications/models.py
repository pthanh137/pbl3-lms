from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """Notification model - automatic notifications for students and teachers."""
    
    NOTIFICATION_TYPES = [
        ('quiz_created', 'Quiz Created'),
        ('quiz_updated', 'Quiz Updated'),
        ('assignment_created', 'Assignment Created'),
        ('assignment_updated', 'Assignment Updated'),
        ('lesson_created', 'Lesson Created'),
        ('lesson_updated', 'Lesson Updated'),
        ('section_created', 'Section Created'),
        ('section_updated', 'Section Updated'),
        ('grade_released', 'Grade Released'),
        ('student_submission', 'Student Submission'),
        ('question_posted', 'Question Posted'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        default='quiz_created'
    )
    target_url = models.CharField(max_length=500, blank=True, null=True)
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['course', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.save(update_fields=['is_read'])


def create_notification(user, title, message, notification_type='quiz_created', target_url=None, course=None):
    """
    Helper function to create a notification.
    
    Args:
        user: User instance (recipient)
        title: Notification title
        message: Notification message
        notification_type: Type of notification (default: 'quiz_created')
        target_url: URL to redirect when clicked (optional)
        course: Course instance (optional)
    
    Returns:
        Notification instance
    """
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        target_url=target_url,
        course=course
    )


def create_notifications_for_enrolled_students(course, title, message, notification_type='quiz_created', target_url=None):
    """
    Helper function to create notifications for all enrolled students in a course.
    
    Args:
        course: Course instance
        title: Notification title
        message: Notification message
        notification_type: Type of notification (default: 'quiz_created')
        target_url: URL to redirect when clicked (optional)
    
    Returns:
        List of created Notification instances
    """
    from enrollments.models import Enrollment
    
    enrollments = Enrollment.objects.filter(course=course).select_related('student')
    notifications = []
    
    for enrollment in enrollments:
        notification = Notification.objects.create(
            user=enrollment.student,
            title=title,
            message=message,
            notification_type=notification_type,
            target_url=target_url,
            course=course
        )
        notifications.append(notification)
    
    return notifications
