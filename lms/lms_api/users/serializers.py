from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'avatar_url',
            'bio',
            'headline',
            'country',
            'language',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'password_confirm',
            'full_name',
            'role',
        ]
    
    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs
    
    def create(self, validated_data):
        """Create a new user with hashed password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


# Keep old serializer name for backward compatibility
UserRegisterSerializer = RegisterSerializer


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (public and edit)."""
    
    social_links = serializers.JSONField(required=False, allow_null=True)
    date_joined = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'avatar_url',
            'full_name',
            'headline',
            'bio',
            'country',
            'social_links',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']
    
    def validate_social_links(self, value):
        """Validate social_links structure."""
        if value is None:
            return {
                "facebook": "",
                "linkedin": "",
                "github": "",
                "website": ""
            }
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("social_links must be a dictionary")
        
        # Ensure all required keys exist
        default_links = {
            "facebook": "",
            "linkedin": "",
            "github": "",
            "website": ""
        }
        
        for key in default_links:
            if key not in value:
                value[key] = ""
        
        return value


class StudentPublicProfileSerializer(serializers.Serializer):
    """Serializer for public student profile (no authentication required)."""
    
    id = serializers.IntegerField()
    full_name = serializers.CharField(allow_blank=True)
    avatar_url = serializers.URLField(allow_null=True, allow_blank=True)
    bio = serializers.CharField(allow_blank=True)
    country = serializers.CharField(allow_blank=True)
    language = serializers.CharField()
    social_links = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    
    def get_social_links(self, obj):
        """Return social links as dict. If field doesn't exist, return empty dict."""
        # Check if social_links field exists (might not be in current model)
        if hasattr(obj, 'social_links'):
            if isinstance(obj.social_links, dict):
                return obj.social_links
            elif isinstance(obj.social_links, str):
                # If stored as JSON string, parse it
                import json
                try:
                    return json.loads(obj.social_links)
                except:
                    return {}
        # Default structure
        return {
            "linkedin": "",
            "facebook": "",
            "github": ""
        }
    
    def get_stats(self, obj):
        """Compute student statistics."""
        from enrollments.models import Enrollment, LessonProgress
        from reviews.models import CourseReview
        from assessments.models import StudentQuizAttempt, Submission
        from courses.models import Lesson
        from django.db.models import Count, Q
        
        # Total enrolled courses
        enrollments = Enrollment.objects.filter(student=obj)
        total_enrolled_courses = enrollments.count()
        
        # Total completed courses (where completed_lessons == total_lessons)
        # Optimize with annotations to avoid N+1 queries
        completed_courses_count = 0
        enrollments_with_progress = enrollments.select_related('course').prefetch_related(
            'lesson_progresses'
        )
        
        for enrollment in enrollments_with_progress:
            course = enrollment.course
            total_lessons = Lesson.objects.filter(section__course=course).count()
            if total_lessons > 0:
                completed_lessons = LessonProgress.objects.filter(
                    enrollment=enrollment,
                    is_completed=True
                ).count()
                if completed_lessons >= total_lessons:
                    completed_courses_count += 1
        
        # Total reviews
        total_reviews = CourseReview.objects.filter(user=obj).count()
        
        # Total quiz attempts (all attempts, not just completed)
        total_quiz_attempts = StudentQuizAttempt.objects.filter(student=obj).count()
        
        # Total assignments submitted
        total_assignments_submitted = Submission.objects.filter(student=obj).count()
        
        # Member since
        member_since = obj.date_joined.date().isoformat() if obj.date_joined else None
        
        return {
            "total_enrolled_courses": total_enrolled_courses,
            "total_completed_courses": completed_courses_count,
            "total_reviews": total_reviews,
            "total_quiz_attempts": total_quiz_attempts,
            "total_assignments_submitted": total_assignments_submitted,
            "member_since": member_since,
        }
    
    def get_courses(self, obj):
        """Get list of courses with progress information."""
        from enrollments.models import Enrollment, LessonProgress
        from courses.models import Lesson
        
        enrollments = Enrollment.objects.filter(
            student=obj
        ).select_related('course').prefetch_related(
            'lesson_progresses__lesson'
        ).order_by('-created_at')
        
        courses_data = []
        
        for enrollment in enrollments:
            course = enrollment.course
            
            # Get total lessons count
            total_lessons = Lesson.objects.filter(
                section__course=course
            ).count()
            
            # Get completed lessons count
            completed_lessons = LessonProgress.objects.filter(
                enrollment=enrollment,
                is_completed=True
            ).count()
            
            # Calculate progress percentage
            if total_lessons > 0:
                progress_percentage = round((completed_lessons / total_lessons) * 100, 2)
            else:
                progress_percentage = 0.0
            
            course_data = {
                "course_id": course.id,
                "title": course.title,
                "thumbnail_url": course.thumbnail_url or None,
                "progress_percentage": progress_percentage,
                "enrolled_at": enrollment.created_at.isoformat() if enrollment.created_at else None,
                "completed_lessons": completed_lessons,
                "total_lessons": total_lessons,
            }
            
            courses_data.append(course_data)
        
        return courses_data


class InstructorPublicProfileSerializer(serializers.Serializer):
    """Serializer for public instructor profile (no authentication required)."""
    
    id = serializers.IntegerField()
    full_name = serializers.CharField(allow_blank=True)
    headline = serializers.CharField(allow_blank=True)
    bio = serializers.CharField(allow_blank=True)
    avatar_url = serializers.URLField(allow_null=True, allow_blank=True)
    country = serializers.CharField(allow_blank=True)
    social_links = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    
    def get_social_links(self, obj):
        """Return social links as dict."""
        if hasattr(obj, 'social_links') and obj.social_links:
            if isinstance(obj.social_links, dict):
                return obj.social_links
            elif isinstance(obj.social_links, str):
                import json
                try:
                    return json.loads(obj.social_links)
                except:
                    return {}
        # Default structure
        return {
            "facebook": "",
            "linkedin": "",
            "github": "",
            "website": ""
        }
    
    def get_stats(self, obj):
        """Compute instructor statistics with optimized queries."""
        from courses.models import Course
        from enrollments.models import Enrollment
        from reviews.models import CourseReview
        from django.db.models import Avg, Count
        
        # Get all courses taught by this instructor
        instructor_courses = Course.objects.filter(teacher=obj)
        
        # Total courses
        total_courses = instructor_courses.count()
        
        # Total enrollments (all enrollments in instructor's courses)
        total_enrollments = Enrollment.objects.filter(
            course__in=instructor_courses
        ).count()
        
        # Total unique students (distinct students across all courses)
        total_students = Enrollment.objects.filter(
            course__in=instructor_courses
        ).values("student").distinct().count()
        
        # Rating statistics (aggregate across all courses)
        rating_data = CourseReview.objects.filter(
            course__in=instructor_courses
        ).aggregate(
            avg_rating=Avg("rating"),
            total_reviews=Count("id")
        )
        
        # Member since
        member_since = obj.date_joined.date().isoformat() if obj.date_joined else None
        
        return {
            "total_students": total_students,
            "total_enrollments": total_enrollments,
            "total_reviews": rating_data["total_reviews"] or 0,
            "average_rating": round(rating_data["avg_rating"], 2) if rating_data["avg_rating"] else 0.0,
            "total_courses": total_courses,
            "member_since": member_since,
        }
    
    def get_courses(self, obj):
        """Get list of courses taught by instructor with statistics."""
        from courses.models import Course
        from enrollments.models import Enrollment
        from reviews.models import CourseReview
        from django.db.models import Avg, Count
        
        # Get all courses with prefetch for optimization
        courses = Course.objects.filter(teacher=obj).select_related('teacher')
        
        # Prefetch enrollments and reviews for all courses to avoid N+1
        course_ids = list(courses.values_list('id', flat=True))
        
        # Aggregate enrollments count per course
        enrollments_data = (
            Enrollment.objects
            .filter(course_id__in=course_ids)
            .values('course_id')
            .annotate(total_students=Count('id'))
        )
        enrollments_map = {item['course_id']: item['total_students'] for item in enrollments_data}
        
        # Aggregate reviews per course
        reviews_data = (
            CourseReview.objects
            .filter(course_id__in=course_ids)
            .values('course_id')
            .annotate(
                avg_rating=Avg('rating'),
                total_reviews=Count('id')
            )
        )
        reviews_map = {
            item['course_id']: {
                'avg_rating': round(item['avg_rating'], 2) if item['avg_rating'] else 0.0,
                'total_reviews': item['total_reviews'] or 0
            }
            for item in reviews_data
        }
        
        # Build course data list
        courses_data = []
        for course in courses:
            course_id = course.id
            review_info = reviews_map.get(course_id, {'avg_rating': 0.0, 'total_reviews': 0})
            
            courses_data.append({
                "course_id": course.id,
                "title": course.title,
                "thumbnail_url": course.thumbnail_url or None,
                "rating": review_info['avg_rating'],
                "total_reviews": review_info['total_reviews'],
                "total_students": enrollments_map.get(course_id, 0),
            })
        
        return courses_data

