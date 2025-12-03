"""
Announcement Views

API endpoints for announcement system.
"""

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from django.db.models import Q, Count
from django.utils import timezone

from .models import Announcement, AnnouncementReadStatus
from .serializers import (
    AnnouncementSerializer,
    AnnouncementListSerializer,
    AnnouncementSentSerializer,
    AnnouncementDetailSerializer,
    AnnouncementCreateSerializer,
    AnnouncementReadStatusSerializer
)
from .permissions import IsCourseTeacher, IsEnrolledStudent, CanViewAnnouncement
from courses.models import Course
from enrollments.models import Enrollment


class SendAnnouncementAPIView(generics.CreateAPIView):
    """
    POST /api/announcements/send/
    
    Send an announcement to all enrolled students of a course.
    Only teachers of that course may send.
    
    Request body:
    {
        "course_id": <course_id>,
        "title": "",
        "message": ""
    }
    """
    serializer_class = AnnouncementCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsCourseTeacher]
    
    def perform_create(self, serializer):
        """Create announcement and read statuses for enrolled students."""
        # Serializer already validates course_id and teacher
        announcement = serializer.save()
        
        # Read statuses are created in serializer's create method
        return announcement


class SentAnnouncementsListAPIView(generics.ListAPIView):
    """
    GET /api/announcements/sent/
    
    Return all announcements sent by the current teacher.
    Includes statistics: total_students_enrolled, total_read
    """
    serializer_class = AnnouncementSentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get announcements sent by current teacher."""
        user = self.request.user
        
        if user.role != 'teacher':
            raise PermissionDenied("Only teachers can view sent announcements.")
        
        return Announcement.objects.filter(
            teacher=user
        ).select_related('teacher', 'course').order_by('-created_at')


class AnnouncementDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/announcements/<id>/
    
    Return full announcement details with read statistics.
    Teachers can view their own announcements.
    Students can view announcements from courses they enrolled.
    """
    serializer_class = AnnouncementDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get announcement based on user role."""
        user = self.request.user
        
        if user.role == 'teacher':
            # Teachers can view their own announcements
            return Announcement.objects.filter(teacher=user).select_related('teacher', 'course')
        elif user.role == 'student':
            # Students can view announcements from enrolled courses
            enrollments = Enrollment.objects.filter(student=user).select_related('course')
            course_ids = [enrollment.course.id for enrollment in enrollments]
            return Announcement.objects.filter(
                course_id__in=course_ids
            ).select_related('teacher', 'course')
        else:
            return Announcement.objects.none()
    
    def get_object(self):
        """Get announcement and check permissions."""
        try:
            announcement = super().get_object()
        except NotFound:
            raise NotFound("Announcement not found.")
        
        user = self.request.user
        
        # Additional permission check
        if user.role == 'student':
            # Verify student is enrolled
            try:
                Enrollment.objects.get(student=user, course=announcement.course)
            except Enrollment.DoesNotExist:
                raise PermissionDenied("You must be enrolled in this course to view announcements.")
        elif user.role == 'teacher':
            # Verify teacher owns the announcement
            if announcement.teacher != user:
                raise PermissionDenied("You can only view your own announcements.")
        
        return announcement


class CourseAnnouncementsListAPIView(generics.ListAPIView):
    """
    GET /api/announcements/course/<course_id>/
    
    Return all announcements of a course (newest first).
    Only students enrolled OR teacher can view.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get announcements for the course."""
        course_id = self.kwargs.get('course_id')
        
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            raise ValidationError({"detail": "Course not found."})
        
        user = self.request.user
        
        # Check permissions
        if user.role == 'teacher':
            # Teacher can view their own course announcements
            if course.teacher != user:
                raise PermissionDenied("You can only view announcements for your own courses.")
        elif user.role == 'student':
            # Student must be enrolled
            try:
                Enrollment.objects.get(student=user, course=course)
            except Enrollment.DoesNotExist:
                raise PermissionDenied("You must be enrolled in this course to view announcements.")
        else:
            raise PermissionDenied("Invalid user role.")
        
        return Announcement.objects.filter(course=course).select_related(
            'teacher', 'course'
        ).order_by('-created_at')


class MyAnnouncementsListAPIView(generics.ListAPIView):
    """
    GET /api/announcements/my/
    
    For student: return announcements from all enrolled courses (paginated).
    For teacher: return announcements they sent.
    """
    serializer_class = AnnouncementListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get announcements based on user role."""
        user = self.request.user
        
        if user.role == 'student':
            # Get all courses the student is enrolled in
            enrollments = Enrollment.objects.filter(student=user).select_related('course')
            course_ids = [enrollment.course.id for enrollment in enrollments]
            
            # Get announcements from enrolled courses
            return Announcement.objects.filter(
                course_id__in=course_ids
            ).select_related('teacher', 'course').order_by('-created_at')
        
        elif user.role == 'teacher':
            # Get all announcements sent by this teacher
            return Announcement.objects.filter(
                teacher=user
            ).select_related('teacher', 'course').order_by('-created_at')
        
        else:
            return Announcement.objects.none()


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_announcement_read(request, announcement_id):
    """
    PATCH /api/announcements/<id>/mark-read/
    
    Mark an announcement as read for the current student.
    """
    try:
        announcement = Announcement.objects.select_related('course').get(id=announcement_id)
    except Announcement.DoesNotExist:
        return Response(
            {"detail": "Announcement not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is enrolled in the course
    if request.user.role != 'student':
        return Response(
            {"detail": "Only students can mark announcements as read."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        Enrollment.objects.get(student=request.user, course=announcement.course)
    except Enrollment.DoesNotExist:
        return Response(
            {"detail": "You must be enrolled in this course."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or create read status
    read_status, created = AnnouncementReadStatus.objects.get_or_create(
        announcement=announcement,
        student=request.user,
        defaults={'is_read': False}
    )
    
    # Mark as read
    if not read_status.is_read:
        read_status.mark_as_read()
    
    serializer = AnnouncementReadStatusSerializer(read_status)
    return Response(serializer.data, status=status.HTTP_200_OK)
