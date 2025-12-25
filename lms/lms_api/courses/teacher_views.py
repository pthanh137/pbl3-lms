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
from common.permissions import IsApprovedTeacher, IsOwnerOrReadOnly
from .utils import normalize_video_url


class TeacherCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for teachers to manage their own courses.
    
    GET /api/teacher/courses/ - List teacher's courses
    POST /api/teacher/courses/ - Create new course
    GET /api/teacher/courses/{id}/ - Get course detail
    PUT/PATCH /api/teacher/courses/{id}/ - Update course
    DELETE /api/teacher/courses/{id}/ - Delete course
    """
    
    permission_classes = [permissions.IsAuthenticated, IsApprovedTeacher, IsOwnerOrReadOnly]
    
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
    
    permission_classes = [permissions.IsAuthenticated, IsApprovedTeacher]
    
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
        """Validate that the course belongs to the teacher and create notifications."""
        course = serializer.validated_data.get('course')
        if course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only create sections for your own courses.")
        section = serializer.save()
        
        # Create notifications for enrolled students when section is created
        # Only if course is published
        if course.is_published:
            from notifications.models import create_notifications_for_enrolled_students
            create_notifications_for_enrolled_students(
                course=course,
                title=f"New Section: {section.title}",
                message=f"New section '{section.title}' has been added to {course.title}.",
                notification_type='section_created',
                target_url=f"/courses/{course.id}/learn"
            )
    
    def perform_update(self, serializer):
        """Validate that the course belongs to the teacher and create notifications."""
        course = serializer.validated_data.get('course', serializer.instance.course)
        if course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update sections for your own courses.")
        section = serializer.save()
        
        # Create notifications for enrolled students when section is updated
        # Only if course is published
        if course.is_published:
            from notifications.models import create_notifications_for_enrolled_students
            create_notifications_for_enrolled_students(
                course=course,
                title=f"Section Updated: {section.title}",
                message=f"Section '{section.title}' has been updated in {course.title}.",
                notification_type='section_updated',
                target_url=f"/courses/{course.id}/learn"
            )


class TeacherLessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for teachers to manage lessons in their courses.
    
    GET /api/teacher/lessons/ - List lessons in teacher's courses
    POST /api/teacher/lessons/ - Create new lesson
    GET /api/teacher/lessons/{id}/ - Get lesson detail
    PUT/PATCH /api/teacher/lessons/{id}/ - Update lesson
    DELETE /api/teacher/lessons/{id}/ - Delete lesson
    """
    
    permission_classes = [permissions.IsAuthenticated, IsApprovedTeacher]
    
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
        """Validate that the section belongs to teacher's course and create notifications."""
        section = serializer.validated_data.get('section')
        if section.course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only create lessons for sections in your own courses.")
        
        # Normalize video_url before saving
        if 'video_url' in serializer.validated_data and serializer.validated_data['video_url']:
            serializer.validated_data['video_url'] = normalize_video_url(serializer.validated_data['video_url'])
        
        lesson = serializer.save()
        
        # Create notifications for enrolled students when lesson is created
        # Only if course is published
        if section.course.is_published:
            from notifications.models import create_notifications_for_enrolled_students
            create_notifications_for_enrolled_students(
                course=section.course,
                title=f"New Lesson: {lesson.title}",
                message=f"New lesson available: {lesson.title} in {section.course.title}.",
                notification_type='lesson_created',
                target_url=f"/courses/{section.course.id}/learn"
            )
    
    def perform_update(self, serializer):
        """Validate that the section belongs to teacher's course and create notifications."""
        section = serializer.validated_data.get('section', serializer.instance.section)
        if section.course.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update lessons for sections in your own courses.")
        
        # Normalize video_url before saving
        if 'video_url' in serializer.validated_data and serializer.validated_data['video_url']:
            serializer.validated_data['video_url'] = normalize_video_url(serializer.validated_data['video_url'])
        
        lesson = serializer.save()
        
        # Create notifications for enrolled students when lesson is updated
        # Only if course is published
        if section.course.is_published:
            from notifications.models import create_notifications_for_enrolled_students
            create_notifications_for_enrolled_students(
                course=section.course,
                title=f"Lesson Updated: {lesson.title}",
                message=f"Lesson '{lesson.title}' has been updated in {section.course.title}.",
                notification_type='lesson_updated',
                target_url=f"/courses/{section.course.id}/learn"
            )



