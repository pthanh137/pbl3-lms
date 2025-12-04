"""
Utility functions for messaging system.
"""
from enrollments.models import Enrollment
from messaging.models import CourseGroup, GroupMember


def sync_course_group_members(course):
    """
    Sync CourseGroup members with course enrollments.
    
    - Get or create CourseGroup for the course
    - Add teacher (owner) to GroupMember
    - Add all enrolled students to GroupMember
    
    Args:
        course: Course instance
        
    Returns:
        CourseGroup instance
    """
    group, created = CourseGroup.objects.get_or_create(
        course=course,
        defaults={"name": course.title}
    )
    
    # Add teacher (owner) as admin
    teacher = course.teacher
    GroupMember.objects.get_or_create(
        group=group,
        user=teacher,
        defaults={"role": "teacher", "is_admin": True}
    )
    # Update existing teacher members to be admin
    GroupMember.objects.filter(group=group, user=teacher).update(is_admin=True)
    
    # Add all enrolled students
    enrolled_students = Enrollment.objects.filter(course=course).values_list("student_id", flat=True)
    
    for student_id in enrolled_students:
        GroupMember.objects.get_or_create(
            group=group,
            user_id=student_id,
            defaults={"role": "student"}
        )
    
    return group

