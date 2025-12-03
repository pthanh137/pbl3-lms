from rest_framework import serializers
from .models import Enrollment, LessonProgress, CartItem, Payment


class CourseBasicSerializer(serializers.Serializer):
    """Basic course info for enrollment."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    thumbnail_url = serializers.URLField(allow_null=True)
    level = serializers.CharField()
    category = serializers.CharField()


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment model."""
    
    course = serializers.SerializerMethodField()
    
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'course',
            'progress_percent',
            'created_at',
        ]
        read_only_fields = ['created_at']
    
    def get_course(self, obj):
        """Return basic course info."""
        return {
            'id': obj.course.id,
            'title': obj.course.title,
            'thumbnail_url': obj.course.thumbnail_url,
            'level': obj.course.level,
            'category': obj.course.category,
        }


class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for LessonProgress model."""
    
    lesson = serializers.SerializerMethodField()
    
    class Meta:
        model = LessonProgress
        fields = [
            'id',
            'lesson',
            'is_completed',
            'completed_at',
        ]
    
    def get_lesson(self, obj):
        """Return basic lesson info."""
        return {
            'id': obj.lesson.id,
            'title': obj.lesson.title,
        }


class StudentInCourseSerializer(serializers.Serializer):
    """Serializer for student information in a course (teacher view)."""
    
    student_id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    avatar_url = serializers.URLField(allow_null=True, allow_blank=True)
    enrolled_at = serializers.DateTimeField()
    enrollment_type = serializers.CharField(allow_null=True, allow_blank=True)
    price_paid = serializers.FloatField(allow_null=True)
    total_lessons = serializers.IntegerField()
    completed_lessons = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    last_accessed_lesson_id = serializers.IntegerField(allow_null=True)
    last_accessed_lesson_title = serializers.CharField(allow_null=True, allow_blank=True)
    last_accessed_at = serializers.DateTimeField(allow_null=True)
    quiz_attempts_count = serializers.IntegerField()
    assignments_submitted_count = serializers.IntegerField()


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem model."""
    
    course_id = serializers.IntegerField(source="course.id", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.CharField(source="course.thumbnail_url", read_only=True, allow_null=True)
    course_price = serializers.DecimalField(source="course.price", max_digits=10, decimal_places=2, read_only=True)
    price_at_add = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            "id",
            "course_id",
            "course_title",
            "course_thumbnail",
            "course_price",
            "price_at_add",
            "created_at",
        ]


class PaymentHistorySerializer(serializers.ModelSerializer):
    """Serializer for Payment history."""
    
    course_id = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    course_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            "id",
            "reference_code",
            "course_id",
            "course_title",
            "course_thumbnail",
            "amount",
            "currency",
            "status",
            "source",
            "created_at",
        ]
    
    def get_course_id(self, obj):
        return obj.course.id if obj.course else None
    
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None
    
    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail_url if obj.course else None
