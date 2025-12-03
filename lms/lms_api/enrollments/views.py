from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q, Max
from django.shortcuts import get_object_or_404
from .models import Enrollment, LessonProgress, Certificate, CartItem, Payment
from .serializers import EnrollmentSerializer, StudentInCourseSerializer, CartItemSerializer, PaymentHistorySerializer, PaymentHistorySerializer
from courses.models import Course, Lesson
from common.permissions import IsTeacher
from assessments.models import StudentQuizAttempt, Submission, Quiz, Assignment


class EnrollCourseAPIView(generics.CreateAPIView):
    """
    Enroll in a course.
    
    POST /api/courses/<int:course_id>/enroll/
    Headers: Authorization: Bearer <access_token>
    """
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EnrollmentSerializer
    
    def create(self, request, course_id=None):
        """Create enrollment for current user."""
        try:
            course = Course.objects.get(id=course_id, is_published=True)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found or not published.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if enrollment already exists
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course,
            defaults={'progress_percent': 0}
        )
        
        if not created:
            return Response(
                {'detail': 'You are already enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyEnrollmentsListAPIView(generics.ListAPIView):
    """
    Get current user's enrollments.
    
    GET /api/enrollments/me/
    Headers: Authorization: Bearer <access_token>
    """
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EnrollmentSerializer
    
    def get_queryset(self):
        """Get enrollments for current user."""
        return Enrollment.objects.filter(
            student=self.request.user
        ).select_related('course').order_by('-created_at')


class CompleteLessonAPIView(generics.CreateAPIView):
    """
    Mark a lesson as completed.
    
    POST /api/lessons/<int:lesson_id>/complete/
    Headers: Authorization: Bearer <access_token>
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, lesson_id=None):
        """Mark lesson as completed and update progress."""
        try:
            lesson = Lesson.objects.select_related(
                'section', 'section__course'
            ).get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response(
                {'detail': 'Lesson not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        course = lesson.section.course
        
        # Get or create enrollment
        try:
            enrollment = Enrollment.objects.get(
                student=request.user,
                course=course
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'detail': 'You must enroll in this course first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create lesson progress
        lesson_progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson,
            defaults={'is_completed': False}
        )
        
        # Mark as completed if not already
        if not lesson_progress.is_completed:
            lesson_progress.is_completed = True
            lesson_progress.completed_at = timezone.now()
            lesson_progress.save()
        
        # Recalculate progress_percent
        total_lessons = Lesson.objects.filter(
            section__course=course
        ).count()
        
        completed_lessons = LessonProgress.objects.filter(
            enrollment=enrollment,
            is_completed=True
        ).count()
        
        if total_lessons > 0:
            progress_percent = int((completed_lessons * 100) / total_lessons)
        else:
            progress_percent = 0
        
        enrollment.progress_percent = progress_percent
        enrollment.save()
        
        return Response({
            'lesson_id': lesson.id,
            'completed': True,
            'progress_percent': progress_percent,
            'message': 'Lesson marked as completed.'
        }, status=status.HTTP_200_OK)


class StudentMyCoursesAPIView(generics.ListAPIView):
    """
    Get student's enrolled courses with progress details.
    
    GET /api/student/my-courses/
    Headers: Authorization: Bearer <access_token>
    
    Returns:
    [
      {
        "course_id": 1,
        "course_title": "...",
        "course_thumbnail": "...",
        "instructor_name": "...",
        "progress_percentage": 42.5,
        "total_lessons": 24,
        "completed_lessons": 10,
        "last_accessed_lesson_id": 15,
        "last_accessed_lesson_title": "...",
        "status": "in_progress" | "completed",
        "enrolled_at": "2025-11-28T10:00:00Z"
      },
      ...
    ]
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Return student's courses with progress."""
        enrollments = Enrollment.objects.filter(
            student=request.user
        ).select_related('course', 'course__teacher').prefetch_related(
            'lesson_progresses__lesson'
        ).order_by('-created_at')
        
        result = []
        
        for enrollment in enrollments:
            course = enrollment.course
            
            # Get total lessons count
            total_lessons = Lesson.objects.filter(
                section__course=course
            ).count()
            
            # Get completed lessons count
            completed_lessons = LessonProgress.objects.filter(
                enrollment=enrollment,
                is_completed=True
            ).count()
            
            # Get last accessed lesson (most recent lesson progress, completed or not)
            last_lesson_progress = LessonProgress.objects.filter(
                enrollment=enrollment
            ).select_related('lesson').order_by('-completed_at', '-id').first()
            
            # Determine status
            # completed: progress >= 100%
            # in_progress: progress > 0% and < 100%
            # not_started: progress = 0% (optional, can be treated as in_progress for display)
            if enrollment.progress_percent >= 100:
                status_value = 'completed'
            elif enrollment.progress_percent > 0:
                status_value = 'in_progress'
            else:
                # 0% progress - treat as in_progress for display purposes
                status_value = 'in_progress'
            
            # Get instructor name
            instructor_name = ''
            if hasattr(course.teacher, 'full_name') and course.teacher.full_name:
                instructor_name = course.teacher.full_name
            else:
                instructor_name = course.teacher.email or ''
            
            # Get last accessed lesson info
            last_accessed_lesson_id = None
            last_accessed_lesson_title = None
            if last_lesson_progress and last_lesson_progress.lesson:
                last_accessed_lesson_id = last_lesson_progress.lesson.id
                last_accessed_lesson_title = last_lesson_progress.lesson.title
            
            course_data = {
                'course_id': course.id,
                'course_title': course.title,
                'course_thumbnail': course.thumbnail_url or '',
                'instructor_name': instructor_name,
                'progress_percentage': float(enrollment.progress_percent),
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'last_accessed_lesson_id': last_accessed_lesson_id,
                'last_accessed_lesson_title': last_accessed_lesson_title,
                'status': status_value,
                'enrolled_at': enrollment.created_at.isoformat() if enrollment.created_at else None,
                'enrollment_type': enrollment.enrollment_type,
                'granted_certificate': enrollment.granted_certificate,
            }
            
            result.append(course_data)
        
        return Response(result, status=status.HTTP_200_OK)


class TeacherCourseStudentsView(generics.GenericAPIView):
    """
    List all students enrolled in a course (teacher view).
    
    GET /api/teacher/courses/<course_id>/students/
    
    Query Parameters:
    - ?status=in_progress - filter students who haven't completed
    - ?status=completed - filter students who completed the course
    - ?q=keyword - search by student name or email
    
    Returns list of students with their progress and activity data.
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = StudentInCourseSerializer
    
    def get(self, request, course_id, *args, **kwargs):
        """Return list of students enrolled in the course."""
        # Get course and verify teacher ownership
        course = get_object_or_404(Course, id=course_id)
        
        if course.teacher != request.user:
            return Response(
                {'detail': 'You do not have permission to view students for this course.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all enrollments for this course
        enrollments = Enrollment.objects.filter(
            course=course
        ).select_related('student').prefetch_related(
            'lesson_progresses__lesson'
        )
        
        # Apply search filter
        search_query = request.query_params.get('q', '').strip()
        if search_query:
            enrollments = enrollments.filter(
                Q(student__full_name__icontains=search_query) |
                Q(student__email__icontains=search_query)
            )
        
        # Get total lessons count for the course (once)
        total_lessons = Lesson.objects.filter(
            section__course=course
        ).count()
        
        # Build student data list
        students_data = []
        
        for enrollment in enrollments:
            student = enrollment.student
            
            # Get completed lessons count
            completed_lessons = LessonProgress.objects.filter(
                enrollment=enrollment,
                is_completed=True
            ).count()
            
            # Calculate progress percentage
            if total_lessons > 0:
                progress_percentage = (completed_lessons / total_lessons) * 100
            else:
                progress_percentage = 0.0
            
            # Apply status filter
            status_filter = request.query_params.get('status', '').strip()
            if status_filter == 'completed':
                if completed_lessons < total_lessons:
                    continue  # Skip if not completed
            elif status_filter == 'in_progress':
                if completed_lessons >= total_lessons:
                    continue  # Skip if completed
            
            # Get last accessed lesson (most recent lesson progress by ID)
            last_lesson_progress = LessonProgress.objects.filter(
                enrollment=enrollment
            ).select_related('lesson').order_by('-id').first()
            
            last_accessed_lesson_id = None
            last_accessed_lesson_title = None
            last_accessed_at = None
            
            if last_lesson_progress:
                last_accessed_lesson_id = last_lesson_progress.lesson.id
                last_accessed_lesson_title = last_lesson_progress.lesson.title
                # Use completed_at if available, otherwise use enrollment created_at as fallback
                last_accessed_at = last_lesson_progress.completed_at
                if not last_accessed_at:
                    # If no completed_at, use enrollment created_at as proxy
                    last_accessed_at = enrollment.created_at
            
            # Get distinct completed quizzes count for this course (count unique quizzes, not retakes)
            quiz_attempts_count = StudentQuizAttempt.objects.filter(
                student=student,
                quiz__course=course,
                status='completed'
            ).values('quiz').distinct().count()
            
            # Get assignment submissions count for this course
            assignments_submitted_count = Submission.objects.filter(
                student=student,
                assignment__course=course
            ).count()
            
            student_data = {
                'student_id': student.id,
                'full_name': student.full_name or '',
                'email': student.email,
                'avatar_url': student.avatar_url or None,
                'enrolled_at': enrollment.created_at,
                'enrollment_type': enrollment.enrollment_type,
                'price_paid': float(enrollment.price_paid) if enrollment.price_paid else 0.0,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percentage': round(progress_percentage, 2),
                'last_accessed_lesson_id': last_accessed_lesson_id,
                'last_accessed_lesson_title': last_accessed_lesson_title or None,
                'last_accessed_at': last_accessed_at,
                'quiz_attempts_count': quiz_attempts_count,
                'assignments_submitted_count': assignments_submitted_count,
            }
            
            students_data.append(student_data)
        
        # Serialize and return
        serializer = self.get_serializer(students_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RemoveStudentFromCourseView(generics.GenericAPIView):
    """
    Remove a student from a course (teacher only).
    
    DELETE /api/teacher/courses/<course_id>/students/<student_id>/
    
    This will:
    - Delete the Enrollment
    - Delete all LessonProgress for this student in this course
    - Delete all StudentQuizAttempt for quizzes in this course
    - Delete all Submissions for assignments in this course
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def delete(self, request, course_id, student_id, *args, **kwargs):
        """Remove student from course and delete related data."""
        # Get course and verify teacher ownership
        course = get_object_or_404(Course, id=course_id)
        
        if course.teacher != request.user:
            return Response(
                {'detail': 'You do not have permission to remove students from this course.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get enrollment and verify student is enrolled
        try:
            enrollment = Enrollment.objects.get(
                course=course,
                student_id=student_id
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'detail': 'Student is not enrolled in this course.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete related data
        
        # 1. Delete LessonProgress for this enrollment
        LessonProgress.objects.filter(enrollment=enrollment).delete()
        
        # 2. Delete StudentQuizAttempt for quizzes in this course
        quizzes = Quiz.objects.filter(course=course)
        StudentQuizAttempt.objects.filter(
            student_id=student_id,
            quiz__in=quizzes
        ).delete()
        
        # 3. Delete Submissions for assignments in this course
        assignments = Assignment.objects.filter(course=course)
        Submission.objects.filter(
            student_id=student_id,
            assignment__in=assignments
        ).delete()
        
        # 4. Finally, delete the Enrollment
        enrollment.delete()
        
        return Response(
            {'message': 'Student removed from course.'},
            status=status.HTTP_200_OK
        )


class PurchaseCourseAPIView(APIView):
    """
    Purchase or audit enroll in a course.
    
    POST /api/courses/<int:course_id>/purchase/
    Body: { "mode": "audit" | "paid" }
    
    Requires: IsAuthenticated, role=student
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, course_id):
        """Handle course purchase/audit enrollment."""
        # Check user role
        if request.user.role != 'student':
            return Response(
                {'detail': 'Only students can purchase courses.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get course
        try:
            course = Course.objects.get(id=course_id, is_published=True)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found or not published.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is the teacher
        if course.teacher == request.user:
            return Response(
                {'detail': 'You cannot purchase your own course.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get mode from request (default to "paid")
        mode = request.data.get('mode', 'paid')
        if mode not in ['audit', 'paid']:
            return Response(
                {'detail': 'Mode must be "audit" or "paid".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get existing enrollment
        existing = Enrollment.objects.filter(
            student=request.user,
            course=course
        ).first()
        
        # Case a: Already has paid enrollment
        if existing and existing.enrollment_type == 'paid':
            return Response({
                'message': 'Already purchased',
                'already_enrolled': True,
                'enrollment_type': 'paid'
            }, status=status.HTTP_200_OK)
        
        # Case b: Has audit enrollment, upgrading to paid
        if existing and existing.enrollment_type == 'audit' and mode == 'paid':
            existing.enrollment_type = 'paid'
            existing.price_paid = course.price or 0
            existing.save()
            # Create payment record for upgrade
            Payment.objects.create(
                user=request.user,
                course=course,
                enrollment=existing,
                amount=existing.price_paid,
                currency="USD",
                status="succeeded",
                source="upgrade",
            )
            return Response({
                'message': 'Upgraded to paid enrollment',
                'already_enrolled': True,
                'enrollment_type': 'paid'
            }, status=status.HTTP_200_OK)
        
        # Case c: Audit enrollment, no existing
        if mode == 'audit' and not existing:
            enrollment = Enrollment.objects.create(
                student=request.user,
                course=course,
                enrollment_type='audit',
                price_paid=0,
                progress_percent=0
            )
            return Response({
                'message': 'Enrolled as audit',
                'already_enrolled': False,
                'enrollment_type': 'audit'
            }, status=status.HTTP_201_CREATED)
        
        # Case d: Paid enrollment, no existing
        if mode == 'paid' and not existing:
            enrollment = Enrollment.objects.create(
                student=request.user,
                course=course,
                enrollment_type='paid',
                price_paid=course.price or 0,
                progress_percent=0
            )
            # Create payment record
            Payment.objects.create(
                user=request.user,
                course=course,
                enrollment=enrollment,
                amount=enrollment.price_paid,
                currency="USD",
                status="succeeded",
                source="single",
            )
            return Response({
                'message': 'Course purchased successfully',
                'already_enrolled': False,
                'enrollment_type': 'paid'
            }, status=status.HTTP_201_CREATED)
        
        # Fallback (should not reach here)
        return Response(
            {'detail': 'Invalid enrollment state.'},
            status=status.HTTP_400_BAD_REQUEST
        )


class IssueCertificateAPIView(APIView):
    """
    Issue certificate for a completed paid course.
    
    POST /api/courses/<int:course_id>/certificate/issue/
    
    Requires: IsAuthenticated, role=student
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, course_id):
        """Issue certificate if conditions are met."""
        # Check user role
        if request.user.role != 'student':
            return Response(
                {'detail': 'Only students can request certificates.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get course
        try:
            course = Course.objects.get(id=course_id, is_published=True)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found or not published.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find paid enrollment
        try:
            enrollment = Enrollment.objects.get(
                student=request.user,
                course=course,
                enrollment_type='paid'
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'detail': 'Certificate only for paid enrollments.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if certificate already exists
        existing_certificate = Certificate.objects.filter(
            user=request.user,
            course=course
        ).first()
        
        if existing_certificate:
            return Response({
                'certificate_id': existing_certificate.id,
                'certificate_code': existing_certificate.certificate_code,
                'course_title': course.title,
                'issued_at': existing_certificate.issued_at,
                'student_name': request.user.full_name or request.user.email,
            }, status=status.HTTP_200_OK)
        
        # Compute completion
        total_lessons = Lesson.objects.filter(
            section__course=course
        ).count()
        
        completed_lessons = LessonProgress.objects.filter(
            enrollment=enrollment,
            is_completed=True
        ).count()
        
        # Check if completed
        if total_lessons == 0:
            return Response(
                {'detail': 'Course has no lessons.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if completed_lessons < total_lessons:
            return Response(
                {'detail': 'Course not completed yet.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create certificate
        certificate = Certificate.objects.create(
            user=request.user,
            course=course,
            enrollment=enrollment
        )
        
        # Mark enrollment as having granted certificate
        enrollment.granted_certificate = True
        enrollment.save()
        
        return Response({
            'certificate_id': certificate.id,
            'certificate_code': certificate.certificate_code,
            'course_title': course.title,
            'issued_at': certificate.issued_at,
            'student_name': request.user.full_name or request.user.email,
        }, status=status.HTTP_201_CREATED)


class MyCertificateAPIView(APIView):
    """
    Get current user's certificate for a course.
    
    GET /api/courses/<int:course_id>/certificate/me/
    
    Requires: IsAuthenticated
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, course_id):
        """Return user's certificate for the course."""
        try:
            certificate = Certificate.objects.get(
                user=request.user,
                course_id=course_id
            )
            return Response({
                'certificate_id': certificate.id,
                'certificate_code': certificate.certificate_code,
                'course_title': certificate.course.title,
                'issued_at': certificate.issued_at,
                'student_name': request.user.full_name or request.user.email,
            }, status=status.HTTP_200_OK)
        except Certificate.DoesNotExist:
            return Response(
                {'detail': 'Certificate not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class MyCertificatesListAPIView(generics.ListAPIView):
    """
    List all certificates for current user.
    
    GET /api/me/certificates/
    
    Requires: IsAuthenticated
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Return list of user's certificates."""
        certificates = Certificate.objects.filter(
            user=request.user
        ).select_related('course', 'enrollment').order_by('-issued_at')
        
        result = []
        for cert in certificates:
            result.append({
                'certificate_id': cert.id,
                'certificate_code': cert.certificate_code,
                'course_id': cert.course.id,
                'course_title': cert.course.title,
                'issued_at': cert.issued_at,
                'student_name': request.user.full_name or request.user.email,
            })
        
        return Response(result, status=status.HTTP_200_OK)


class PaymentHistoryListAPIView(APIView):
    """
    List payment history for current user.
    
    GET /api/enrollments/me/payments/
    
    Requires: IsAuthenticated
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return list of user's payment history."""
        qs = (
            Payment.objects.filter(user=request.user)
            .select_related("course")
            .order_by("-created_at")
        )
        serializer = PaymentHistorySerializer(qs, many=True)
        return Response(serializer.data)


