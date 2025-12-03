from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class CourseReview(models.Model):
    """Review model for courses - each student can leave exactly ONE review per course."""
    
    course = models.ForeignKey(
        "courses.Course",
        related_name="reviews",
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="course_reviews",
        on_delete=models.CASCADE
    )
    
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("course", "user")
        ordering = ("-created_at",)
        db_table = 'course_reviews'
    
    def __str__(self):
        return f"{self.course_id} - {self.user_id} ({self.rating})"
