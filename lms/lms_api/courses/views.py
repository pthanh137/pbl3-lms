from rest_framework import viewsets, generics, filters, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from .models import Course, Section, Lesson
from enrollments.models import Enrollment
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    CourseCurriculumSerializer,
    LessonSerializer
)
from .utils import check_video_available, replace_lesson_video


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


class ReplaceLessonVideoAPIView(APIView):
    """
    Replace lesson video if it's unavailable.
    Called by frontend when video fails to load.
    
    POST /api/lessons/{lesson_id}/replace-video/
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, lesson_id):
        """Replace video for a lesson."""
        lesson = get_object_or_404(
            Lesson.objects.select_related('section', 'section__course'),
            pk=lesson_id
        )
        
        # Check enrollment
        course = lesson.section.course
        is_enrolled = Enrollment.objects.filter(
            student=request.user,
            course=course
        ).exists()
        
        if not is_enrolled:
            raise PermissionDenied(
                detail='You must enroll in this course first to access lessons.'
            )
        
        # Check if video is actually unavailable
        if lesson.video_url and check_video_available(lesson.video_url):
            # Video is available, no need to replace
            return Response({
                'success': False,
                'message': 'Video is still available',
                'video_url': lesson.video_url
            }, status=status.HTTP_200_OK)
        
        # Get used video IDs to avoid duplicates
        from .utils import get_used_video_ids
        used_video_ids = get_used_video_ids(exclude_lesson_id=lesson.id)
        
        # Replace video (ensuring uniqueness)
        success = replace_lesson_video(
            lesson, 
            reason='frontend_error_triggered',
            used_video_ids=used_video_ids
        )
        
        if success:
            # Refresh lesson from database
            lesson.refresh_from_db()
            serializer = LessonSerializer(lesson, context={'request': request})
            return Response({
                'success': True,
                'message': 'Video replaced successfully',
                'lesson': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Could not find replacement video'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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



