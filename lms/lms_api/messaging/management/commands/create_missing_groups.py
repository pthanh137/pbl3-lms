"""
Management command to create missing CourseGroups for existing courses.

Usage:
    python manage.py create_missing_groups
"""
from django.core.management.base import BaseCommand
from courses.models import Course
from messaging.models import CourseGroup
from messaging.utils import sync_course_group_members


class Command(BaseCommand):
    help = 'Create CourseGroups for courses that do not have groups yet'

    def handle(self, *args, **options):
        """Create groups for all courses that don't have one."""
        all_courses = Course.objects.all()
        created_count = 0
        existing_count = 0
        
        self.stdout.write('Checking courses for missing groups...')
        
        for course in all_courses:
            try:
                group = CourseGroup.objects.get(course=course)
                existing_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Course "{course.title}" already has group')
                )
            except CourseGroup.DoesNotExist:
                # Use sync function to create group, add teacher, and sync all students
                group = sync_course_group_members(course)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created group for course "{course.title}"')
                )
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'Summary: Created {created_count} new groups, {existing_count} already existed'
            )
        )

