from django.db import models
from django.conf import settings
import uuid


class Enrollment(models.Model):
    """Enrollment model - student enrolled in a course."""
    
    ENROLLMENT_TYPES = [
        ("audit", "Audit"),
        ("paid", "Paid"),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    progress_percent = models.PositiveIntegerField(default=0, help_text="Progress percentage (0-100)")
    enrollment_type = models.CharField(
        max_length=10,
        choices=ENROLLMENT_TYPES,
        default="audit",
    )
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    granted_certificate = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'enrollments'
        unique_together = ['student', 'course']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.email} - {self.course.title} ({self.enrollment_type})"


class LessonProgress(models.Model):
    """LessonProgress model - tracks student progress on lessons."""
    
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='lesson_progresses'
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        related_name='progresses'
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'lesson_progresses'
        unique_together = ['enrollment', 'lesson']
    
    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.enrollment.student.email} - {self.lesson.title} ({status})"


class Certificate(models.Model):
    """Certificate model - issued to students who complete paid courses."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_code = models.CharField(max_length=32, unique=True)
    
    class Meta:
        db_table = 'certificates'
        unique_together = ['user', 'course']
        ordering = ['-issued_at']
    
    def __str__(self):
        return f"Certificate for {self.user.email} - {self.course.title}"
    
    def save(self, *args, **kwargs):
        """Generate certificate_code if not provided."""
        if not self.certificate_code:
            self.certificate_code = uuid.uuid4().hex[:32]
        super().save(*args, **kwargs)


class CartItem(models.Model):
    """CartItem model - simple cart system for students."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    price_at_add = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "cart_items"
        unique_together = ("user", "course")
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.user_id} - {self.course_id}"


class Payment(models.Model):
    """Payment model - records payment transactions for course purchases."""
    
    STATUS_CHOICES = [
        ("succeeded", "Succeeded"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    
    SOURCE_CHOICES = [
        ("single", "Single course purchase"),
        ("cart", "Cart checkout"),
        ("upgrade", "Upgrade from audit"),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="succeeded",
    )
    
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="single",
    )
    
    reference_code = models.CharField(
        max_length=64,
        unique=True,
        blank=True,
        help_text="Fake transaction ID for this payment.",
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]
    
    def save(self, *args, **kwargs):
        if not self.reference_code:
            self.reference_code = f"PAY-{uuid.uuid4().hex[:16].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user_id} - {self.amount} {self.currency} ({self.status})"

