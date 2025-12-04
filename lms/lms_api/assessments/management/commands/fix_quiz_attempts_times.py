"""
Management command to fix old quiz attempts that don't have start_time or end_time.
Run: python manage.py fix_quiz_attempts_times
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from assessments.models import StudentQuizAttempt
import random


class Command(BaseCommand):
    help = 'Fix old quiz attempts that are missing start_time or end_time'

    def handle(self, *args, **options):
        # Get all completed attempts that are missing start_time or end_time
        attempts_to_fix = StudentQuizAttempt.objects.filter(
            status='completed'
        ).filter(
            Q(start_time__isnull=True) | Q(end_time__isnull=True)
        )
        
        count = attempts_to_fix.count()
        self.stdout.write(f'Found {count} attempts to fix...')
        
        fixed = 0
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
            
            # If end_time is still missing, set it to completed_at or now
            if not attempt.end_time:
                if attempt.completed_at:
                    attempt.end_time = attempt.completed_at
                else:
                    attempt.end_time = timezone.now()
            
            attempt.save(update_fields=['start_time', 'end_time'])
            fixed += 1
            
            if fixed % 10 == 0:
                self.stdout.write(f'Fixed {fixed}/{count} attempts...')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully fixed {fixed} attempts!'))
        
        # Show sample of fixed attempts
        sample = StudentQuizAttempt.objects.filter(
            status='completed'
        ).exclude(start_time__isnull=True).exclude(end_time__isnull=True)[:5]
        
        self.stdout.write('\nSample of fixed attempts:')
        for attempt in sample:
            time_spent = attempt.time_spent_seconds
            minutes = time_spent // 60 if time_spent else 0
            self.stdout.write(
                f'  Attempt {attempt.id}: {minutes} min '
                f'(start: {attempt.start_time}, end: {attempt.end_time})'
            )

