"""
Utility functions for courses app.
"""
import re
import urllib.request
import urllib.error
import json
from typing import Optional, Dict, List


def normalize_video_url(url):
    """
    Normalize video URL to embed format for YouTube, or return as-is for other URLs.
    
    Handles:
    - youtube.com/watch?v=VIDEO_ID -> youtube.com/embed/VIDEO_ID
    - youtu.be/VIDEO_ID -> youtube.com/embed/VIDEO_ID
    - youtube.com/embed/VIDEO_ID -> keep as is
    - Other URLs (MP4, Vimeo, etc.) -> return as is
    
    Args:
        url: Video URL string (can be None or empty)
    
    Returns:
        Normalized URL string, or None if input is None/empty
    """
    if not url or not isinstance(url, str):
        return url
    
    url = url.strip()
    if not url:
        return url
    
    # If already an embed URL, return as is
    if 'youtube.com/embed/' in url:
        return url
    
    # Pattern for youtube.com/watch?v=VIDEO_ID
    watch_pattern = r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]+)'
    match = re.search(watch_pattern, url)
    if match:
        video_id = match.group(1)
        return f'https://www.youtube.com/embed/{video_id}'
    
    # Pattern for youtu.be/VIDEO_ID
    short_pattern = r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]+)'
    match = re.search(short_pattern, url)
    if match:
        video_id = match.group(1)
        return f'https://www.youtube.com/embed/{video_id}'
    
    # For other URLs (MP4, Vimeo, direct links, etc.), return as is
    return url


def is_youtube_url(url):
    """
    Check if URL is a YouTube URL.
    
    Args:
        url: Video URL string
    
    Returns:
        True if YouTube URL, False otherwise
    """
    if not url or not isinstance(url, str):
        return False
    return 'youtube.com' in url or 'youtu.be' in url


def is_embed_url(url):
    """
    Check if URL is already in embed format.
    
    Args:
        url: Video URL string
    
    Returns:
        True if embed URL, False otherwise
    """
    if not url or not isinstance(url, str):
        return False
    return 'youtube.com/embed/' in url


def get_youtube_video_id(url):
    """
    Extract YouTube video ID from any YouTube URL format.
    
    Args:
        url: YouTube URL string
    
    Returns:
        Video ID string or None
    """
    if not url or not isinstance(url, str):
        return None
    
    # If embed URL
    if 'youtube.com/embed/' in url:
        match = re.search(r'youtube\.com/embed/([a-zA-Z0-9_-]+)', url)
        return match.group(1) if match else None
    
    # If watch URL
    if 'youtube.com/watch?v=' in url:
        match = re.search(r'[?&]v=([a-zA-Z0-9_-]+)', url)
        return match.group(1) if match else None
    
    # If short URL
    if 'youtu.be/' in url:
        match = re.search(r'youtu\.be/([a-zA-Z0-9_-]+)', url)
        return match.group(1) if match else None
    
    return None


def check_video_available(video_url: str, timeout: int = 5) -> bool:
    """
    Check if a video URL is available and accessible.
    
    For YouTube videos, uses oEmbed API to check availability.
    For other URLs, performs a HEAD request.
    
    Args:
        video_url: Video URL to check
        timeout: Request timeout in seconds (not used with urllib, kept for compatibility)
    
    Returns:
        True if video is available, False otherwise
    """
    if not video_url or not isinstance(video_url, str):
        return False
    
    try:
        if is_youtube_url(video_url):
            # Use YouTube oEmbed API to check video availability
            video_id = get_youtube_video_id(video_url)
            if not video_id:
                return False
            
            oembed_url = f'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json'
            
            try:
                req = urllib.request.Request(oembed_url)
                req.add_header('User-Agent', 'Mozilla/5.0')
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode())
                        # Check if video is embeddable (oEmbed only works for embeddable videos)
                        return True
                    else:
                        return False
            except urllib.error.HTTPError as e:
                # 404 or other error means video doesn't exist or isn't embeddable
                if e.code == 404:
                    return False
                # Other HTTP errors - assume available to avoid false positives
                return True
            except (urllib.error.URLError, OSError):
                # Network error or timeout - assume video might be available but we can't verify
                # Return True to avoid false positives
                return True
        else:
            # For non-YouTube URLs, perform HEAD request
            try:
                req = urllib.request.Request(video_url, method='HEAD')
                req.add_header('User-Agent', 'Mozilla/5.0')
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    return response.status == 200
            except (urllib.error.URLError, OSError):
                # Network error - assume available to avoid false positives
                return True
    except Exception:
        # Any other error - assume available to avoid false positives
        return True


# Hardcoded educational videos by topic
# Each keyword has MULTIPLE video options to ensure uniqueness
# Format: keyword -> list of video URLs (embed format)
EDUCATIONAL_VIDEOS = {
    # Machine Learning / AI - Multiple videos
    'machine learning': [
        'https://www.youtube.com/embed/aircAruvnKk',  # 3Blue1Brown - Neural Networks
        'https://www.youtube.com/embed/Jv1VDI6W4nQ',  # StatQuest - Machine Learning
        'https://www.youtube.com/embed/9f-GarcDY58',  # Machine Learning Course
        'https://www.youtube.com/embed/ukzFI9rgwfU',  # Machine Learning Tutorial
        'https://www.youtube.com/embed/7eh4d6sabA0',  # Machine Learning Basics
    ],
    'neural network': [
        'https://www.youtube.com/embed/aircAruvnKk',  # 3Blue1Brown - Neural Networks
        'https://www.youtube.com/embed/Ilg3gGewQ5U',  # Neural Network Tutorial
        'https://www.youtube.com/embed/0VCOG8IuINo',  # Deep Learning
    ],
    'ai': [
        'https://www.youtube.com/embed/aircAruvnKk',  # 3Blue1Brown - Neural Networks
        'https://www.youtube.com/embed/Jv1VDI6W4nQ',  # StatQuest - Machine Learning
        'https://www.youtube.com/embed/ukzFI9rgwfU',  # AI Tutorial
    ],
    'artificial intelligence': [
        'https://www.youtube.com/embed/aircAruvnKk',  # 3Blue1Brown - Neural Networks
        'https://www.youtube.com/embed/Jv1VDI6W4nQ',  # StatQuest - Machine Learning
        'https://www.youtube.com/embed/ukzFI9rgwfU',  # AI Tutorial
    ],
    
    # Linear Regression / Statistics - Multiple videos
    'linear regression': [
        'https://www.youtube.com/embed/nk2CQITmEoI',  # StatQuest - Linear Regression
        'https://www.youtube.com/embed/zPG4NjIkCjc',  # Linear Regression Tutorial
        'https://www.youtube.com/embed/PaFPbb66DxQ',  # Linear Regression Explained
        'https://www.youtube.com/embed/0T0z8d0_aY4',  # Linear Regression Basics
    ],
    'regression': [
        'https://www.youtube.com/embed/nk2CQITmEoI',  # StatQuest - Linear Regression
        'https://www.youtube.com/embed/zPG4NjIkCjc',  # Linear Regression Tutorial
        'https://www.youtube.com/embed/PaFPbb66DxQ',  # Linear Regression Explained
    ],
    'statistics': [
        'https://www.youtube.com/embed/nk2CQITmEoI',  # StatQuest - Linear Regression
        'https://www.youtube.com/embed/uhxtUt_-GyM',  # Statistics Tutorial
        'https://www.youtube.com/embed/xxpc-HPKN28',  # Statistics Course
    ],
    
    # Python Programming - Multiple videos
    'python': [
        'https://www.youtube.com/embed/rfscVS0vtbw',  # freeCodeCamp - Python Full Course
        'https://www.youtube.com/embed/kqtD5dpn9C8',  # Python for Beginners
        'https://www.youtube.com/embed/_uQrJ0TkZlc',  # Python Tutorial
        'https://www.youtube.com/embed/t8pPdKYpowI',  # Python Programming
        'https://www.youtube.com/embed/eIrMbAQSU34',  # Python Crash Course
    ],
    'python tutorial': [
        'https://www.youtube.com/embed/rfscVS0vtbw',  # freeCodeCamp - Python Full Course
        'https://www.youtube.com/embed/kqtD5dpn9C8',  # Python for Beginners
        'https://www.youtube.com/embed/_uQrJ0TkZlc',  # Python Tutorial
    ],
    'python programming': [
        'https://www.youtube.com/embed/rfscVS0vtbw',  # freeCodeCamp - Python Full Course
        'https://www.youtube.com/embed/kqtD5dpn9C8',  # Python for Beginners
        'https://www.youtube.com/embed/_uQrJ0TkZlc',  # Python Tutorial
    ],
    
    # Web Development - Multiple videos
    'web development': [
        'https://www.youtube.com/embed/1Rs2ND1ryYc',  # freeCodeCamp - Web Development
        'https://www.youtube.com/embed/5bMdjkfvONE',  # Web Development Tutorial
        'https://www.youtube.com/embed/ysEN5RaKOlA',  # Full Stack Web Development
        'https://www.youtube.com/embed/HcWcAfb_kyk',  # Web Development Course
    ],
    'html': [
        'https://www.youtube.com/embed/1Rs2ND1ryYc',  # freeCodeCamp - Web Development
        'https://www.youtube.com/embed/pQN-pnXPaVg',  # HTML Tutorial
        'https://www.youtube.com/embed/UB1O30fR-EE',  # HTML Crash Course
    ],
    'css': [
        'https://www.youtube.com/embed/1Rs2ND1ryYc',  # freeCodeCamp - Web Development
        'https://www.youtube.com/embed/1PnVor36_40',  # CSS Tutorial
        'https://www.youtube.com/embed/yfoY53QXEnI',  # CSS Crash Course
    ],
    'javascript': [
        'https://www.youtube.com/embed/jS4aFq5-91M',  # freeCodeCamp - JavaScript
        'https://www.youtube.com/embed/W6NZfCO5SIk',  # JavaScript Tutorial
        'https://www.youtube.com/embed/PkZNo7MFNFg',  # JavaScript for Beginners
        'https://www.youtube.com/embed/hdI2bqOjy3c',  # JavaScript Crash Course
    ],
    
    # React - Multiple videos
    'react': [
        'https://www.youtube.com/embed/bMknfKXIFA8',  # freeCodeCamp - React
        'https://www.youtube.com/embed/DLX62G4lc44',  # React Tutorial
        'https://www.youtube.com/embed/SqcY0GlETPk',  # React Crash Course
        'https://www.youtube.com/embed/w7ejDZ8SWv8',  # React for Beginners
    ],
    'react tutorial': [
        'https://www.youtube.com/embed/bMknfKXIFA8',  # freeCodeCamp - React
        'https://www.youtube.com/embed/DLX62G4lc44',  # React Tutorial
        'https://www.youtube.com/embed/SqcY0GlETPk',  # React Crash Course
    ],
    'react js': [
        'https://www.youtube.com/embed/bMknfKXIFA8',  # freeCodeCamp - React
        'https://www.youtube.com/embed/DLX62G4lc44',  # React Tutorial
        'https://www.youtube.com/embed/SqcY0GlETPk',  # React Crash Course
    ],
    
    # Django - Multiple videos
    'django': [
        'https://www.youtube.com/embed/F5mRW0jo-U4',  # freeCodeCamp - Django
        'https://www.youtube.com/embed/rHux0gMZ3Eg',  # Django Tutorial
        'https://www.youtube.com/embed/jBzwzrDvZ18',  # Django for Beginners
        'https://www.youtube.com/embed/UmljXziRpLo',  # Django Crash Course
    ],
    'django tutorial': [
        'https://www.youtube.com/embed/F5mRW0jo-U4',  # freeCodeCamp - Django
        'https://www.youtube.com/embed/rHux0gMZ3Eg',  # Django Tutorial
        'https://www.youtube.com/embed/jBzwzrDvZ18',  # Django for Beginners
    ],
    
    # Data Science - Multiple videos
    'data science': [
        'https://www.youtube.com/embed/ua-CiDNNj30',  # freeCodeCamp - Data Science
        'https://www.youtube.com/embed/9f-GarcDY58',  # Data Science Course
        'https://www.youtube.com/embed/X3paOmcrTjQ',  # Data Science Tutorial
        'https://www.youtube.com/embed/LHBE6Q9XlzI',  # Data Science for Beginners
    ],
    'data analysis': [
        'https://www.youtube.com/embed/ua-CiDNNj30',  # freeCodeCamp - Data Science
        'https://www.youtube.com/embed/X3paOmcrTjQ',  # Data Science Tutorial
        'https://www.youtube.com/embed/LHBE6Q9XlzI',  # Data Science for Beginners
    ],
    
    # Default fallback - Multiple general programming videos
    'default': [
        'https://www.youtube.com/embed/rfscVS0vtbw',  # Python tutorial
        'https://www.youtube.com/embed/kqtD5dpn9C8',  # Python for Beginners
        'https://www.youtube.com/embed/_uQrJ0TkZlc',  # Python Tutorial
        'https://www.youtube.com/embed/1Rs2ND1ryYc',  # Web Development
        'https://www.youtube.com/embed/jS4aFq5-91M',  # JavaScript
    ],
}


def get_used_video_ids(exclude_lesson_id: Optional[int] = None) -> set:
    """
    Get set of all video IDs currently used in lessons.
    
    Args:
        exclude_lesson_id: Lesson ID to exclude from used list (for replacement)
    
    Returns:
        Set of video IDs (strings)
    """
    from .models import Lesson
    
    used_ids = set()
    
    # Get all lessons with video URLs
    lessons = Lesson.objects.exclude(video_url__isnull=True).exclude(video_url='')
    
    if exclude_lesson_id:
        lessons = lessons.exclude(id=exclude_lesson_id)
    
    for lesson in lessons:
        if lesson.video_url and is_youtube_url(lesson.video_url):
            video_id = get_youtube_video_id(lesson.video_url)
            if video_id:
                used_ids.add(video_id)
    
    return used_ids


def find_replacement_video(
    lesson_title: str, 
    course_title: str = '', 
    exclude_lesson_id: Optional[int] = None,
    used_video_ids: Optional[set] = None,
    max_attempts: int = 50
) -> Optional[str]:
    """
    Find a replacement video based on lesson and course titles.
    Ensures the video is NOT already used by another lesson.
    
    STRICT RULES:
    - Never reuse a video_id that's already in use
    - Never fallback to default videos if they're already used
    - Return None if no unique video can be found
    
    Args:
        lesson_title: Title of the lesson (required for context)
        course_title: Title of the course (optional, for better matching)
        exclude_lesson_id: Lesson ID to exclude from used list
        used_video_ids: Set of video IDs already used (if None, will fetch from DB)
        max_attempts: Maximum number of videos to try before giving up
    
    Returns:
        Replacement video URL (embed format) or None if no unique video found
    """
    # Get used video IDs if not provided
    if used_video_ids is None:
        used_video_ids = get_used_video_ids(exclude_lesson_id=exclude_lesson_id)
    
    if not lesson_title:
        # Without lesson title, we cannot find context-appropriate video
        # Return None instead of using generic default
        return None
    
    # Combine lesson and course titles for better matching
    search_text = f"{lesson_title} {course_title}".lower()
    
    # Step 1: Get candidate videos based on keyword matching
    # Priority: videos that match lesson/course keywords
    candidate_videos = []
    
    # Check for keyword matches (case-insensitive)
    matched_keywords = []
    for keyword, video_list in EDUCATIONAL_VIDEOS.items():
        if keyword != 'default' and keyword in search_text:
            matched_keywords.append(keyword)
            if isinstance(video_list, list):
                candidate_videos.extend(video_list)
            else:
                candidate_videos.append(video_list)
    
    # Step 2: If no keyword match, try to find videos from related topics
    # But still prioritize context over generic defaults
    if not candidate_videos:
        # Try to extract main topic from lesson title
        # This is a fallback but still tries to be context-aware
        lesson_words = set(lesson_title.lower().split())
        
        # Look for partial matches or related topics
        for keyword, video_list in EDUCATIONAL_VIDEOS.items():
            if keyword == 'default':
                continue
            
            # Check if any word from lesson title matches keyword
            keyword_words = set(keyword.split())
            if lesson_words.intersection(keyword_words):
                if isinstance(video_list, list):
                    candidate_videos.extend(video_list)
                else:
                    candidate_videos.append(video_list)
    
    # Step 3: Remove duplicates from candidates while preserving order
    seen_urls = set()
    unique_candidates = []
    for video_url in candidate_videos:
        if video_url and video_url not in seen_urls:
            seen_urls.add(video_url)
            unique_candidates.append(video_url)
    
    # Step 4: Try candidate videos (prioritized by keyword match)
    attempts = 0
    for video_url in unique_candidates:
        if attempts >= max_attempts:
            break
        
        if not video_url:
            continue
        
        attempts += 1
        
        # Check if video is available
        if not check_video_available(video_url):
            continue
        
        # CRITICAL: Check if video ID is already used
        video_id = get_youtube_video_id(video_url)
        if not video_id:
            continue
        
        if video_id in used_video_ids:
            # This video is already used by another lesson - SKIP IT
            continue
        
        # Found a valid, unique replacement video
        return video_url
    
    # Step 5: If no keyword-matched video found, try ALL educational videos
    # But ONLY if we haven't exhausted all options
    # This is a last resort, but still respects uniqueness constraint
    all_videos = []
    for keyword, video_list in EDUCATIONAL_VIDEOS.items():
        if keyword == 'default':
            # Skip default - we want context-specific videos
            continue
        if isinstance(video_list, list):
            all_videos.extend(video_list)
        else:
            all_videos.append(video_list)
    
    # Remove duplicates
    seen_urls = set()
    unique_all_videos = []
    for video_url in all_videos:
        if video_url and video_url not in seen_urls:
            seen_urls.add(video_url)
            unique_all_videos.append(video_url)
    
    # Try each unique video from all educational videos
    for video_url in unique_all_videos:
        if attempts >= max_attempts:
            break
        
        if not video_url:
            continue
        
        attempts += 1
        
        # Check if video is available
        if not check_video_available(video_url):
            continue
        
        # CRITICAL: Check if video ID is already used
        video_id = get_youtube_video_id(video_url)
        if not video_id:
            continue
        
        if video_id in used_video_ids:
            # This video is already used - SKIP IT
            continue
        
        # Found a valid, unique replacement video
        return video_url
    
    # Step 6: If STILL no unique video found, return None
    # DO NOT fallback to default or reuse existing videos
    # It's better to have no video than duplicate videos
    return None


def replace_lesson_video(lesson, reason: str = 'video_unavailable', used_video_ids: Optional[set] = None) -> bool:
    """
    Replace a lesson's video with a replacement video.
    STRICT RULE: Ensures the replacement video is NOT already used by another lesson.
    
    If no unique video can be found, the lesson.video_url will remain unchanged
    (or be set to None if it was missing). This is better than reusing a video.
    
    Args:
        lesson: Lesson instance
        reason: Reason for replacement
        used_video_ids: Set of video IDs already used (if None, will fetch from DB)
    
    Returns:
        True if replacement was successful, False otherwise (no video found or already used)
    """
    if not lesson:
        return False
    
    old_video_url = lesson.video_url or ''
    
    # Get used video IDs if not provided
    if used_video_ids is None:
        used_video_ids = get_used_video_ids(exclude_lesson_id=lesson.id)
    
    # Get course title for better context matching
    course_title = ''
    if lesson.section and lesson.section.course:
        course_title = lesson.section.course.title
    
    # Find replacement video (excluding current lesson's video and all used videos)
    # This function will return None if no unique video can be found
    new_video_url = find_replacement_video(
        lesson.title, 
        course_title,
        exclude_lesson_id=lesson.id,
        used_video_ids=used_video_ids,
        max_attempts=50  # Try up to 50 different videos
    )
    
    # CRITICAL: If no unique video found, DO NOT update lesson
    # Better to have no video than duplicate videos
    if not new_video_url:
        return False
    
    # Final verification: ensure new video ID is not already used
    # This is a safety check (should not happen if find_replacement_video works correctly)
    new_video_id = get_youtube_video_id(new_video_url)
    if not new_video_id:
        return False
    
    if new_video_id in used_video_ids:
        # This should never happen, but if it does, abort replacement
        # Do NOT try again - we've already checked all videos
        return False
    
    # Verify video is still available (double-check)
    if not check_video_available(new_video_url):
        return False
    
    # All checks passed - update lesson with new unique video
    lesson.video_url = new_video_url
    lesson.save(update_fields=['video_url'])
    
    # Log the replacement
    from .models import VideoReplacementLog
    VideoReplacementLog.objects.create(
        lesson=lesson,
        old_video_url=old_video_url,
        new_video_url=new_video_url,
        reason=reason
    )
    
    return True
