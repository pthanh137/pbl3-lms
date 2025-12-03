from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Announcement(models.Model):
    """Announcement model - teachers send announcements to enrolled students."""
    
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='announcements'
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='announcements_sent'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['course', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.course.title}"
    
    def clean(self):
        """Validate that teacher is the instructor of the course."""
        if self.teacher and self.course:
            if self.course.teacher != self.teacher:
                raise ValidationError(
                    {'teacher': 'Teacher must be the instructor of the course.'}
                )
    
    def save(self, *args, **kwargs):
        """Override save to call clean validation."""
        self.full_clean()
        super().save(*args, **kwargs)


class AnnouncementReadStatus(models.Model):
    """AnnouncementReadStatus model - tracks which students have read announcements."""
    
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name='read_statuses'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='announcement_read_statuses'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'announcement_read_statuses'
        unique_together = ['announcement', 'student']
        indexes = [
            models.Index(fields=['student', 'is_read']),
            models.Index(fields=['announcement', 'is_read']),
        ]
    
    def __str__(self):
        status = "Read" if self.is_read else "Unread"
        return f"{self.student.email} - {self.announcement.title} ({status})"
    
    def mark_as_read(self):
        """Mark announcement as read for this student."""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
