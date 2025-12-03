from rest_framework import viewsets, generics, filters, permissions
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Prefetch
from .models import Course, Section, Lesson
from enrollments.models import Enrollment
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    CourseCurriculumSerializer,
    LessonSerializer
)


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Course model.
    
    GET /api/courses/ - List all published courses
    GET /api/courses/{id}/ - Get course detail
    """
    
    queryset = Course.objects.filter(is_published=True).select_related('teacher')
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'subtitle', 'description']
    ordering_fields = ['created_at', 'price', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        return queryset


class CourseCurriculumAPIView(generics.RetrieveAPIView):
    """
    Get course curriculum with nested sections and lessons.
    Includes completion status for authenticated enrolled users.
    
    GET /api/courses/{id}/curriculum/
    """
    
    queryset = Course.objects.filter(is_published=True).prefetch_related(
        Prefetch(
            'sections',
            queryset=Section.objects.order_by('sort_order', 'id')
        ),
        Prefetch(
            'sections__lessons',
            queryset=Lesson.objects.order_by('sort_order', 'id')
        )
    )
    serializer_class = CourseCurriculumSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'
    
    def get_serializer_context(self):
        """Add request to serializer context for completion status."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class LessonDetailAPIView(generics.RetrieveAPIView):
    """
    Get a single lesson detail.
    Requires authentication and enrollment in the course.
    
    GET /api/lessons/{id}/
    """
    
    queryset = Lesson.objects.select_related('section', 'section__course')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_serializer_context(self):
        """Add request to serializer context for document_file_url."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_object(self):
        """Check if user is enrolled in the course before allowing access."""
        lesson = super().get_object()
        course = lesson.section.course
        
        # Check if user is enrolled
        is_enrolled = Enrollment.objects.filter(
            student=self.request.user,
            course=course
        ).exists()
        
        if not is_enrolled:
            raise PermissionDenied(
                detail='You must enroll in this course first to access lessons.'
            )
        
        return lesson


class CourseCategoriesListAPIView(APIView):
    """
    Get list of all unique categories from published courses.
    
    GET /api/courses/categories/
    
    Returns:
    - categories: List of unique category strings
    """
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Return list of unique categories from published courses."""
        categories = (
            Course.objects
            .filter(is_published=True, category__isnull=False)
            .exclude(category='')
            .values_list('category', flat=True)
            .distinct()
            .order_by('category')
        )
        
        return Response({
            'categories': list(categories)
        })



