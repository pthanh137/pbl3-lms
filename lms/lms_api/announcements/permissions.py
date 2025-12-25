from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from enrollments.models import Enrollment


class IsCourseTeacher(permissions.BasePermission):
    """Permission to check if user is an approved teacher of a course."""
    
    def has_permission(self, request, view):
        """Check if user is authenticated, is an approved teacher."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be an approved teacher
        if request.user.role != 'teacher' or not request.user.is_approved:
            return False
        
        # For create actions, check course_id in request data
        if request.method == 'POST':
            course_id = request.data.get('course_id')
            if course_id:
                from courses.models import Course
                try:
                    course = Course.objects.get(id=course_id)
                    return course.teacher == request.user
                except Course.DoesNotExist:
                    return False
        
        # For other actions, check in view
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the teacher of the announcement's course."""
        if hasattr(obj, 'course'):
            return obj.course.teacher == request.user
        return False


class IsEnrolledStudent(permissions.BasePermission):
    """Permission to check if user is enrolled in a course."""
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is a student."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # For course-specific views, check enrollment
        course_id = view.kwargs.get('course_id') or request.query_params.get('course_id')
        if course_id:
            try:
                enrollment = Enrollment.objects.get(
                    student=request.user,
                    course_id=course_id
                )
                return True
            except Enrollment.DoesNotExist:
                return False
        
        return request.user.role == 'student'
    
    def has_object_permission(self, request, view, obj):
        """Check if user is enrolled in the announcement's course."""
        if hasattr(obj, 'course'):
            try:
                enrollment = Enrollment.objects.get(
                    student=request.user,
                    course=obj.course
                )
                return True
            except Enrollment.DoesNotExist:
                return False
        return False


class CanViewAnnouncement(permissions.BasePermission):
    """Permission to view announcement: teacher or enrolled student."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user can view this announcement."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Teacher can view their own announcements
        if obj.course.teacher == request.user:
            return True
        
        # Student can view if enrolled
        if request.user.role == 'student':
            try:
                Enrollment.objects.get(
                    student=request.user,
                    course=obj.course
                )
                return True
            except Enrollment.DoesNotExist:
                return False
        
        return False



