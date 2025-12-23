from rest_framework import serializers
from users.models import User
from courses.models import Course
from enrollments.models import Enrollment, Payment
from django.db.models import Sum, Count, Avg
from reviews.models import CourseReview


class AdminTeacherSerializer(serializers.ModelSerializer):
    """Serializer for teacher list in admin view."""
    
    total_courses = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'avatar_url',
            'headline',
            'bio',
            'country',
            'is_approved',
            'date_joined',
            'total_courses',
            'total_students',
        ]
        read_only_fields = ['id', 'date_joined', 'total_courses', 'total_students']
    
    def get_total_courses(self, obj):
        """Get total courses created by this teacher."""
        return Course.objects.filter(teacher=obj).count()
    
    def get_total_students(self, obj):
        """Get total unique students across all courses."""
        return Enrollment.objects.filter(
            course__teacher=obj
        ).values('student').distinct().count()


class AdminStudentSerializer(serializers.ModelSerializer):
    """Serializer for student list in admin view."""
    
    total_enrollments = serializers.SerializerMethodField()
    total_courses_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'avatar_url',
            'country',
            'date_joined',
            'total_enrollments',
            'total_courses_completed',
        ]
        read_only_fields = ['id', 'date_joined', 'total_enrollments', 'total_courses_completed']
    
    def get_total_enrollments(self, obj):
        """Get total enrollments for this student."""
        return Enrollment.objects.filter(student=obj).count()
    
    def get_total_courses_completed(self, obj):
        """Get total completed courses (progress >= 100%)."""
        from courses.models import Lesson
        from enrollments.models import LessonProgress
        
        enrollments = Enrollment.objects.filter(student=obj).select_related('course')
        completed_count = 0
        
        for enrollment in enrollments:
            total_lessons = Lesson.objects.filter(section__course=enrollment.course).count()
            if total_lessons > 0:
                completed_lessons = LessonProgress.objects.filter(
                    enrollment=enrollment,
                    is_completed=True
                ).count()
                if completed_lessons >= total_lessons:
                    completed_count += 1
        
        return completed_count


class AdminCourseSerializer(serializers.ModelSerializer):
    """Serializer for course list in admin view."""
    
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    total_students = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'subtitle',
            'thumbnail_url',
            'price',
            'level',
            'category',
            'is_published',
            'created_at',
            'updated_at',
            'teacher',
            'teacher_name',
            'teacher_email',
            'total_students',
            'total_revenue',
            'average_rating',
            'reviews_count',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'total_students',
            'total_revenue', 'average_rating', 'reviews_count'
        ]
    
    def get_total_students(self, obj):
        """Get total students enrolled in this course."""
        return Enrollment.objects.filter(course=obj).count()
    
    def get_total_revenue(self, obj):
        """Get total revenue from this course (from successful payments)."""
        revenue = Payment.objects.filter(
            course=obj,
            status='succeeded'
        ).aggregate(total=Sum('amount'))['total']
        return float(revenue) if revenue else 0.0
    
    def get_average_rating(self, obj):
        """Get average rating for this course."""
        rating = CourseReview.objects.filter(course=obj).aggregate(avg=Avg('rating'))['avg']
        return round(rating, 2) if rating else None
    
    def get_reviews_count(self, obj):
        """Get total reviews for this course."""
        return CourseReview.objects.filter(course=obj).count()


class AdminRevenueSerializer(serializers.Serializer):
    """Serializer for revenue statistics."""
    
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_payments = serializers.IntegerField()
    total_courses_sold = serializers.IntegerField()
    total_students_paid = serializers.IntegerField()
    revenue_by_course = serializers.ListField(child=serializers.DictField())
    recent_payments = serializers.ListField(child=serializers.DictField())


class AdminRevenueAnalyticsSerializer(serializers.Serializer):
    """Serializer for revenue analytics data for charts."""
    
    revenue_by_time = serializers.ListField(child=serializers.DictField())
    revenue_by_course = serializers.ListField(child=serializers.DictField())
    payment_ratio = serializers.ListField(child=serializers.DictField())

