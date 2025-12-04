"""
Signals for courses app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from courses.models import Course
from enrollments.models import Enrollment
from messaging.models import CourseGroup, GroupMember
from messaging.utils import sync_course_group_members


@receiver(post_save, sender=Course)
def create_course_group(sender, instance, created, **kwargs):
    """Auto-create CourseGroup when Course is created."""
    if created:
        group = CourseGroup.objects.create(course=instance, name=instance.title)
        
        # Add teacher as admin member
        GroupMember.objects.create(group=group, user=instance.teacher, is_admin=True, role='teacher')


@receiver(post_save, sender=Enrollment)
def auto_add_student_to_group(sender, instance, created, **kwargs):
    """Auto-add student to group when enrollment is created."""
    if created:
        sync_course_group_members(instance.course)

