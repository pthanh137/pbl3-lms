from rest_framework import serializers
from .models import Course, Section, Lesson


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson model."""
    
    document_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id',
            'section',
            'title',
            'video_url',
            'document_file',
            'document_file_url',
            'content',
            'duration',
            'sort_order',
        ]
    
    def get_document_file_url(self, obj):
        """Return full URL for document file if exists."""
        if obj.document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document_file.url)
            return obj.document_file.url
        return None


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section model."""
    
    class Meta:
        model = Section
        fields = [
            'id',
            'course',
            'title',
            'sort_order',
        ]


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model (list view)."""
    
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
            'average_rating',
            'reviews_count',
        ]
        read_only_fields = ['created_at', 'average_rating', 'reviews_count']
    
    def get_average_rating(self, obj):
        """Calculate average rating from all reviews."""
        from django.db.models import Avg
        result = obj.reviews.aggregate(avg_rating=Avg('rating'))
        return round(result['avg_rating'], 2) if result['avg_rating'] else None
    
    def get_reviews_count(self, obj):
        """Get total number of reviews."""
        return obj.reviews.count()


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for Course model (detail view)."""
    
    teacher_id = serializers.IntegerField(source='teacher.id', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    enrollment_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'subtitle',
            'description',
            'thumbnail_url',
            'price',
            'level',
            'category',
            'is_published',
            'created_at',
            'updated_at',
            'teacher',
            'teacher_id',
            'teacher_name',
            'average_rating',
            'reviews_count',
            'is_enrolled',
            'enrollment_type',
        ]
        read_only_fields = ['created_at', 'updated_at', 'average_rating', 'reviews_count', 'is_enrolled', 'enrollment_type']
    
    def get_average_rating(self, obj):
        """Calculate average rating from all reviews."""
        from django.db.models import Avg
        result = obj.reviews.aggregate(avg_rating=Avg('rating'))
        return round(result['avg_rating'], 2) if result['avg_rating'] else None
    
    def get_reviews_count(self, obj):
        """Get total number of reviews."""
        return obj.reviews.count()
    
    def get_is_enrolled(self, obj):
        """Check if current user is enrolled in this course."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != 'student':
            return False
        
        from enrollments.models import Enrollment
        return Enrollment.objects.filter(
            student=request.user,
            course=obj
        ).exists()
    
    def get_enrollment_type(self, obj):
        """Get enrollment type for current user if enrolled."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        if request.user.role != 'student':
            return None
        
        from enrollments.models import Enrollment
        enrollment = Enrollment.objects.filter(
            student=request.user,
            course=obj
        ).first()
        
        return enrollment.enrollment_type if enrollment else None


class CurriculumLessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson in curriculum with completion status."""
    is_completed = serializers.SerializerMethodField()
    document_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id',
            'title',
            'video_url',
            'document_file',
            'document_file_url',
            'content',
            'duration',
            'sort_order',
            'is_completed',
        ]
    
    def get_document_file_url(self, obj):
        """Return full URL for document file if exists."""
        if obj.document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document_file.url)
            return obj.document_file.url
        return None
    
    def get_is_completed(self, obj):
        """Check if lesson is completed for the current user."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        
        # Get enrollment for this course
        from enrollments.models import Enrollment, LessonProgress
        try:
            enrollment = Enrollment.objects.get(
                student=request.user,
                course=obj.section.course
            )
            # Check if lesson progress exists and is completed
            lesson_progress = LessonProgress.objects.filter(
                enrollment=enrollment,
                lesson=obj,
                is_completed=True
            ).first()
            return lesson_progress is not None
        except Enrollment.DoesNotExist:
            return False


class CurriculumSectionSerializer(serializers.ModelSerializer):
    """Serializer for Section with nested lessons (for curriculum)."""
    
    lessons = CurriculumLessonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = [
            'id',
            'title',
            'sort_order',
            'lessons',
        ]


class CourseCurriculumSerializer(serializers.ModelSerializer):
    """Serializer for Course with nested sections and lessons."""
    
    sections = CurriculumSectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'subtitle',
            'description',
            'level',
            'sections',
        ]


# Teacher CRUD Serializers
class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses (teacher only)."""
    
    class Meta:
        model = Course
        fields = [
            'title',
            'subtitle',
            'description',
            'thumbnail_url',
            'price',
            'level',
            'category',
            'is_published',
        ]


class SectionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating sections (teacher only)."""
    
    class Meta:
        model = Section
        fields = [
            'course',
            'title',
            'sort_order',
        ]


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating lessons (teacher only)."""
    
    class Meta:
        model = Lesson
        fields = [
            'section',
            'title',
            'video_url',
            'document_file',
            'content',
            'duration',
            'sort_order',
        ]
