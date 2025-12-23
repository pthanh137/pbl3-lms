"""
Management command to replace all unavailable videos in lessons.

Usage:
    python manage.py replace_unavailable_videos
    python manage.py replace_unavailable_videos --check-only  # Only check, don't replace
    python manage.py replace_unavailable_videos --lesson-id 123  # Replace specific lesson
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from courses.models import Lesson
from courses.utils import check_video_available, replace_lesson_video, get_used_video_ids, is_youtube_url


class Command(BaseCommand):
    help = 'Replace all unavailable videos in lessons with unique replacement videos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check videos, do not replace',
        )
        parser.add_argument(
            '--lesson-id',
            type=int,
            help='Replace video for specific lesson ID only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be replaced without actually replacing',
        )

    def handle(self, *args, **options):
        check_only = options['check_only']
        lesson_id = options.get('lesson_id')
        dry_run = options.get('dry_run', False)

        # Get lessons to process
        if lesson_id:
            lessons = Lesson.objects.filter(id=lesson_id)
            if not lessons.exists():
                self.stdout.write(self.style.ERROR(f'Lesson {lesson_id} not found.'))
                return
        else:
            lessons = Lesson.objects.exclude(video_url__isnull=True).exclude(video_url='')

        total_lessons = lessons.count()
        self.stdout.write(f'Processing {total_lessons} lessons...')

        # Get all used video IDs once (for efficiency)
        used_video_ids = get_used_video_ids()
        self.stdout.write(f'Found {len(used_video_ids)} videos already in use.')

        unavailable_count = 0
        replaced_count = 0
        failed_count = 0
        duplicate_count = 0

        # Check for duplicate videos
        video_id_to_lessons = {}
        for lesson in lessons:
            if lesson.video_url and is_youtube_url(lesson.video_url):
                from courses.utils import get_youtube_video_id
                video_id = get_youtube_video_id(lesson.video_url)
                if video_id:
                    if video_id not in video_id_to_lessons:
                        video_id_to_lessons[video_id] = []
                    video_id_to_lessons[video_id].append(lesson)

        # Find duplicates and replace them
        duplicate_lessons_to_replace = []
        for video_id, lesson_list in video_id_to_lessons.items():
            if len(lesson_list) > 1:
                duplicate_count += len(lesson_list) - 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Video {video_id} is used by {len(lesson_list)} lessons: {[l.id for l in lesson_list]}'
                    )
                )
                # Keep first lesson, replace others
                for lesson in lesson_list[1:]:
                    duplicate_lessons_to_replace.append(lesson)

        if check_only:
            self.stdout.write(self.style.SUCCESS(f'\nCheck complete:'))
            self.stdout.write(f'  Total lessons: {total_lessons}')
            self.stdout.write(f'  Duplicate videos: {duplicate_count} lessons')
            return

        # First, replace duplicate videos (keep first occurrence, replace others)
        if duplicate_lessons_to_replace:
            self.stdout.write(f'\nReplacing {len(duplicate_lessons_to_replace)} duplicate videos...')
            for lesson in duplicate_lessons_to_replace:
                if not dry_run:
                    success = replace_lesson_video(
                        lesson,
                        reason='management_command_duplicate_fix',
                        used_video_ids=used_video_ids
                    )
                    if success:
                        replaced_count += 1
                        # Add new video ID to used set
                        from courses.utils import get_youtube_video_id
                        new_video_id = get_youtube_video_id(lesson.video_url)
                        if new_video_id:
                            used_video_ids.add(new_video_id)
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Lesson {lesson.id}: Replaced duplicate video with {lesson.video_url}'
                            )
                        )
                    else:
                        failed_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f'Lesson {lesson.id}: Failed to find replacement for duplicate video'
                            )
                        )
                else:
                    self.stdout.write(f'[DRY RUN] Would replace duplicate video for lesson {lesson.id}')

        # Process each lesson for unavailable videos
        for lesson in lessons:
            if not lesson.video_url:
                continue

            # Check if video is available
            is_available = check_video_available(lesson.video_url)
            
            if not is_available:
                unavailable_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Lesson {lesson.id} ({lesson.title}): Video unavailable'
                    )
                )

                if not dry_run:
                    # Replace video
                    # Update used_video_ids as we go
                    success = replace_lesson_video(
                        lesson, 
                        reason='management_command_batch_replace',
                        used_video_ids=used_video_ids
                    )

                    if success:
                        replaced_count += 1
                        # Add new video ID to used set
                        from courses.utils import get_youtube_video_id
                        new_video_id = get_youtube_video_id(lesson.video_url)
                        if new_video_id:
                            used_video_ids.add(new_video_id)
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  ✓ Replaced with: {lesson.video_url}'
                            )
                        )
                    else:
                        failed_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ✗ Failed to find replacement video'
                            )
                        )
                else:
                    self.stdout.write(f'  [DRY RUN] Would replace this video')

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(f'Total lessons processed: {total_lessons}')
        self.stdout.write(f'Unavailable videos found: {unavailable_count}')
        if not dry_run:
            self.stdout.write(f'Successfully replaced: {replaced_count}')
            self.stdout.write(f'Failed to replace: {failed_count}')
        else:
            self.stdout.write(f'[DRY RUN] Would replace {unavailable_count} videos')

