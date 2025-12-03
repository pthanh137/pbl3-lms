from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.db.models import Q
from .models import Course, Section, Lesson
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    SectionSerializer,
    SectionCreateUpdateSerializer,
    LessonSerializer,
    LessonCreateUpdateSerializer,
)
from common.permissions import IsTeacher, IsOwnerOrReadOnly


class TeacherCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for teachers to manage their own courses.
    
    GET /api/teacher/courses/ - List teacher's courses
    POST /api/teacher/courses/ - Create new course
    GET /api/teacher/courses/{id}/ - Get course detail
    PUT/PATCH /api/teacher/courses/{id}/ - Update course
    DELETE /api/teacher/courses/{id}/ - Delete course
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        """Return only courses owned by the current teacher."""
        return Course.objects.filter(teacher=self.request.user).select_related('teacher')
    
    def get_serializer_class(self):
        """Use different serializers for create/update vs retrieve/list."""
        if self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        elif self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def perform_create(self, serializer):
        """Always set teacher to current user when creating."""
        serializer.save(teacher=self.request.user)


class TeacherSectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for teachers to manage sections in their courses.
    
    GET /api/teacher/sections/ - List sections in teacher's courses
    POST /api/teacher/sections/ - Create new section
    GET /api/teacher/sections/{id}/ - Get section detail
    PUT/PATCH /api/teacher/sections/{id}/ - Update section
    DELETE /api/teacher/sections/{id}/ - Delete section
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def get_queryset(self):
        """Return only sections that belong to teacher's courses."""
        return Section.objects.filter(
            course__teacher=self.request.user
        ).select_related('course', 'course__teacher').order_by('course', 'sort_order')
    
    def get_serializer_class(self):
        """Use different serializers for create/update vs retrieve/list."""
        if self.action in ['create', 'update', 'partial_update']:
            return SectionCreateUpdateSerializer
        return SectionSerializer
    
    def perform_create(self, serializer):
        """Validate that the course belongs to the teacher."""
        course = serializer.validated_data.get('course')
        if course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only create sections for your own courses.")
        serializer.save()
    
    def perform_update(self, serializer):
        """Validate that the course belongs to the teacher."""
        course = serializer.validated_data.get('course', serializer.instance.course)
        if course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update sections for your own courses.")
        serializer.save()


class TeacherLessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for teachers to manage lessons in their courses.
    
    GET /api/teacher/lessons/ - List lessons in teacher's courses
    POST /api/teacher/lessons/ - Create new lesson
    GET /api/teacher/lessons/{id}/ - Get lesson detail
    PUT/PATCH /api/teacher/lessons/{id}/ - Update lesson
    DELETE /api/teacher/lessons/{id}/ - Delete lesson
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def get_queryset(self):
        """Return only lessons that belong to teacher's courses."""
        return Lesson.objects.filter(
            section__course__teacher=self.request.user
        ).select_related('section', 'section__course', 'section__course__teacher').order_by('section', 'sort_order')
    
    def get_serializer_class(self):
        """Use different serializers for create/update vs retrieve/list."""
        if self.action in ['create', 'update', 'partial_update']:
            return LessonCreateUpdateSerializer
        return LessonSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context for document_file_url."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Validate that the section belongs to teacher's course."""
        section = serializer.validated_data.get('section')
        if section.course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only create lessons for sections in your own courses.")
        serializer.save()
    
    def perform_update(self, serializer):
        """Validate that the section belongs to teacher's course."""
        section = serializer.validated_data.get('section', serializer.instance.section)
        if section.course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update lessons for sections in your own courses.")
        serializer.save()



