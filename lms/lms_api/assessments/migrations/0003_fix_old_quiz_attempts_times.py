# Generated migration to fix old quiz attempts

from django.db import migrations
from django.db.models import Q
from django.utils import timezone
import random


def fix_old_quiz_attempts(apps, schema_editor):
    """Fix old quiz attempts that don't have start_time or end_time."""
    StudentQuizAttempt = apps.get_model('assessments', 'StudentQuizAttempt')
    
    # Get all attempts that are missing start_time or end_time
    attempts_to_fix = StudentQuizAttempt.objects.filter(
        status='completed'
    ).filter(
        Q(start_time__isnull=True) | Q(end_time__isnull=True)
    )
    
    for attempt in attempts_to_fix:
        # If end_time is missing, set it to completed_at
        if not attempt.end_time and attempt.completed_at:
            attempt.end_time = attempt.completed_at
        
        # If start_time is missing, estimate it from completed_at
        if not attempt.start_time:
            if attempt.completed_at:
                # Random between 1-20 minutes before completed_at
                random_minutes = random.randint(1, 20)
                attempt.start_time = attempt.completed_at - timezone.timedelta(minutes=random_minutes)
            elif attempt.started_at:
                # Fallback to started_at if completed_at is missing
                attempt.start_time = attempt.started_at
            else:
                # Last resort: use current time
                attempt.start_time = timezone.now()
        
        attempt.save(update_fields=['start_time', 'end_time'])


def reverse_fix(apps, schema_editor):
    """Reverse migration - no need to undo data fixes."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0002_studentquizattempt_end_time_and_more'),
    ]

    operations = [
        migrations.RunPython(fix_old_quiz_attempts, reverse_fix),
    ]

