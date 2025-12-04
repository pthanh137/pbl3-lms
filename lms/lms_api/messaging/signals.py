"""
Signals for automatic group creation and member management.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .utils import sync_course_group_members
from courses.models import Course


@receiver(post_save, sender=Course)
def handle_course_save(sender, instance, created, **kwargs):
    """
    Auto-create CourseGroup when Course is created or updated.
    
    When a Course object is created:
    - Create CourseGroup with group.name = course.title
    - Add the teacher to GroupMember (role="teacher")
    - Sync all enrolled students
    
    When a Course is updated (teacher assignment):
    - Ensure teacher is added to GroupMember (role="teacher")
    - Sync all enrolled students
    - If group doesn't exist, create it
    """
    # Use sync function to ensure group exists, teacher is added, and all students are synced
    sync_course_group_members(instance)

