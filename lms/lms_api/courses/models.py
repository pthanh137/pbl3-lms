from django.db import models
from django.conf import settings


class Course(models.Model):
    """Course model."""
    
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    thumbnail_url = models.URLField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    category = models.CharField(max_length=100, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Section(models.Model):
    """Section model - part of a course."""
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='sections'
    )
    title = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'sections'
        ordering = ['sort_order', 'id']
        unique_together = ['course', 'sort_order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Lesson(models.Model):
    """Lesson model - part of a section."""
    
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='lessons'
    )
    title = models.CharField(max_length=255)
    video_url = models.URLField(blank=True, null=True)
    document_file = models.FileField(upload_to='lesson_documents/', blank=True, null=True, help_text="PDF, DOC, DOCX, or other document file")
    content = models.TextField(blank=True)
    duration = models.PositiveIntegerField(default=0, help_text="Duration in seconds")
    sort_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'lessons'
        ordering = ['sort_order', 'id']
        unique_together = ['section', 'sort_order']
    
    def save(self, *args, **kwargs):
        """Normalize video_url before saving."""
        if self.video_url:
            from .utils import normalize_video_url
            self.video_url = normalize_video_url(self.video_url)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.section.title} - {self.title}"


class VideoReplacementLog(models.Model):
    """Log model for video replacements."""
    
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='video_replacements'
    )
    old_video_url = models.URLField()
    new_video_url = models.URLField()
    replaced_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, blank=True, help_text="Reason for replacement (e.g., 'video_unavailable')")
    
    class Meta:
        db_table = 'video_replacement_logs'
        ordering = ['-replaced_at']
    
    def __str__(self):
        return f"Lesson {self.lesson.id} - Replaced at {self.replaced_at}"
