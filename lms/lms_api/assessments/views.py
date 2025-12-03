"""
Assessments Views

This module provides API endpoints for Quizzes and Assignments.

BASIC FLOW:

Teacher:
1. Creates a quiz for a course: POST /api/teacher/quizzes/
2. Adds questions: POST /api/teacher/quizzes/{quiz_id}/questions/
3. Adds choices: POST /api/teacher/questions/{question_id}/choices/
4. Publishes quiz: PATCH /api/teacher/quizzes/{id}/ (set is_published=True)
5. Creates an assignment: POST /api/teacher/assignments/
6. Views submissions: GET /api/teacher/assignments/{id}/submissions/
7. Grades submission: PATCH /api/teacher/submissions/{id}/grade/

Student:
1. Views quizzes: GET /api/courses/{course_id}/quizzes/
2. Views quiz details: GET /api/quizzes/{id}/
3. Starts quiz: POST /api/quizzes/{id}/start/
4. Submits answers: POST /api/quizzes/{id}/submit/ (returns score)
5. Views attempts: GET /api/quizzes/{id}/attempts/me/
6. Views assignments: GET /api/courses/{course_id}/assignments/
7. Submits assignment: POST /api/assignments/{id}/submit/
8. Views graded submission: GET /api/assignments/{id}/my-submission/
"""

from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
import uuid
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q

from common.permissions import IsTeacher
from courses.models import Course
from enrollments.models import Enrollment
from .models import (
    Quiz, Question, Choice, StudentQuizAttempt, StudentAnswer,
    Assignment, Submission
)
from .serializers import (
    QuizSerializer, QuizDetailTeacherSerializer, QuizDetailStudentSerializer,
    QuestionSerializer, QuestionCreateSerializer, QuestionPublicSerializer,
    ChoiceSerializer, ChoiceCreateSerializer,
    StudentQuizAttemptSerializer,
    AssignmentSerializer, AssignmentDetailSerializer,
    SubmissionSerializer, SubmissionStudentSerializer,
    QuizSubmitSerializer
)


# ==================== TEACHER QUIZ MANAGEMENT ====================

class TeacherQuizViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher quiz management."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = QuizSerializer
    
    def get_queryset(self):
        """Return quizzes for courses taught by current teacher."""
        return Quiz.objects.filter(course__teacher=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailTeacherSerializer
        return QuizSerializer
    
    def perform_create(self, serializer):
        """Ensure teacher owns the course."""
        course = serializer.validated_data['course']
        if course.teacher != self.request.user:
            raise permissions.PermissionDenied("You can only create quizzes for your own courses.")
        serializer.save()


class QuestionCreateAPIView(generics.CreateAPIView):
    """Create a question for a quiz."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = QuestionCreateSerializer
    
    def post(self, request, quiz_id):
        """Create a question for the specified quiz."""
        quiz = get_object_or_404(Quiz, id=quiz_id, course__teacher=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save(quiz=quiz)
        return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class QuestionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Manage a single question."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = QuestionSerializer
    queryset = Question.objects.all()
    
    def get_queryset(self):
        """Only allow access to questions in quizzes owned by teacher."""
        return Question.objects.filter(quiz__course__teacher=self.request.user)


class ChoiceCreateAPIView(generics.CreateAPIView):
    """Create a choice for a question."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = ChoiceCreateSerializer
    
    def post(self, request, question_id):
        """Create a choice for the specified question."""
        question = get_object_or_404(
            Question,
            id=question_id,
            quiz__course__teacher=request.user
        )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        choice = serializer.save(question=question)
        return Response(ChoiceSerializer(choice).data, status=status.HTTP_201_CREATED)


class ChoiceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Manage a single choice."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = ChoiceSerializer
    queryset = Choice.objects.all()
    
    def get_queryset(self):
        """Only allow access to choices in questions owned by teacher."""
        return Choice.objects.filter(question__quiz__course__teacher=self.request.user)


# ==================== STUDENT QUIZ USAGE ====================

class CourseQuizzesListAPIView(generics.ListAPIView):
    """List published quizzes for a course."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizSerializer
    
    def get_queryset(self):
        """Return published quizzes for the course."""
        course_id = self.kwargs['course_id']
        return Quiz.objects.filter(course_id=course_id, is_published=True)


class QuizDetailAPIView(generics.RetrieveAPIView):
    """Get quiz detail (student view - no correct answers)."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizDetailStudentSerializer
    queryset = Quiz.objects.filter(is_published=True)


class QuizStartAPIView(generics.CreateAPIView):
    """Start a quiz attempt."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentQuizAttemptSerializer
    
    def post(self, request, pk):
        """Create or get existing in_progress attempt."""
        quiz = get_object_or_404(Quiz, id=pk, is_published=True)
        
        # Check enrollment
        is_enrolled = Enrollment.objects.filter(
            student=request.user,
            course=quiz.course
        ).exists()
        
        if not is_enrolled:
            return Response(
                {'detail': 'You must enroll in this course first.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create in_progress attempt
        attempt = StudentQuizAttempt.objects.filter(
            student=request.user,
            quiz=quiz,
            status='in_progress'
        ).first()
        
        if not attempt:
            attempt = StudentQuizAttempt.objects.create(
                student=request.user,
                quiz=quiz,
                status='in_progress',
                started_at=timezone.now()
            )
            created = True
        else:
            created = False
        
        serializer = self.get_serializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class QuizSubmitAPIView(generics.CreateAPIView):
    """Submit quiz answers and calculate score."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizSubmitSerializer
    
    def post(self, request, pk):
        """Submit answers and calculate score."""
        quiz = get_object_or_404(Quiz, id=pk, is_published=True)
        
        # Check enrollment
        is_enrolled = Enrollment.objects.filter(
            student=request.user,
            course=quiz.course
        ).exists()
        
        if not is_enrolled:
            return Response(
                {'detail': 'You must enroll in this course first.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create attempt (reuse existing in_progress, or create new if completed)
        attempt = StudentQuizAttempt.objects.filter(
            student=request.user,
            quiz=quiz,
            status='in_progress'
        ).first()
        
        if not attempt:
            # Create new attempt
            attempt = StudentQuizAttempt.objects.create(
                student=request.user,
                quiz=quiz,
                status='in_progress',
                started_at=timezone.now()
            )
        
        # Parse answers
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']
        
        # Calculate score
        total_points = sum(q.points for q in quiz.questions.all())
        obtained_points = 0
        
        for answer_data in answers_data:
            question_id = answer_data.get('question')
            choice_id = answer_data.get('selected_choice')
            
            if not question_id or not choice_id:
                continue
            
            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
                choice = Choice.objects.get(id=choice_id, question=question)
                
                # Create or update answer
                student_answer, _ = StudentAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={'selected_choice': choice}
                )
                
                # Check if correct
                if choice.is_correct:
                    obtained_points += question.points
                    
            except (Question.DoesNotExist, Choice.DoesNotExist):
                continue
        
        # Calculate percentage
        percentage = (obtained_points / total_points * 100) if total_points > 0 else 0
        
        # Update attempt
        attempt.score = obtained_points
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.save()
        
        return Response({
            'score': obtained_points,
            'total_points': total_points,
            'percentage': round(percentage, 2)
        }, status=status.HTTP_200_OK)


class QuizAttemptsMeAPIView(generics.ListAPIView):
    """Get current student's attempts for a quiz."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentQuizAttemptSerializer
    
    def get_queryset(self):
        """Return attempts for current student and quiz."""
        quiz_id = self.kwargs['pk']
        return StudentQuizAttempt.objects.filter(
            student=self.request.user,
            quiz_id=quiz_id
        ).order_by('-started_at')


# ==================== TEACHER ASSIGNMENT MANAGEMENT ====================

class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher assignment management."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = AssignmentSerializer
    
    def get_queryset(self):
        """Return assignments for courses taught by current teacher."""
        return Assignment.objects.filter(course__teacher=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return AssignmentDetailSerializer
        return AssignmentSerializer
    
    def perform_create(self, serializer):
        """Ensure teacher owns the course."""
        course = serializer.validated_data['course']
        if course.teacher != self.request.user:
            raise permissions.PermissionDenied("You can only create assignments for your own courses.")
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """List all submissions for this assignment."""
        assignment = self.get_object()
        submissions = Submission.objects.filter(assignment=assignment)
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class SubmissionGradeAPIView(generics.UpdateAPIView):
    """Grade a submission."""
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = SubmissionSerializer
    queryset = Submission.objects.all()
    
    def get_queryset(self):
        """Only allow grading submissions for assignments owned by teacher."""
        return Submission.objects.filter(assignment__course__teacher=self.request.user)
    
    def patch(self, request, pk):
        """Grade the submission."""
        submission = self.get_object()
        
        grade = request.data.get('grade')
        feedback = request.data.get('feedback', '')
        
        if grade is None:
            return Response(
                {'detail': 'Grade is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            grade = float(grade)
            max_points = submission.assignment.max_points
            if grade < 0 or grade > max_points:
                return Response(
                    {'detail': f'Grade must be between 0 and {max_points}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid grade value.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        submission.grade = grade
        submission.feedback = feedback
        submission.status = 'graded'
        submission.graded_at = timezone.now()
        submission.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)


# ==================== STUDENT ASSIGNMENT USAGE ====================

class CourseAssignmentsListAPIView(generics.ListAPIView):
    """List published assignments for a course."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AssignmentSerializer
    
    def get_queryset(self):
        """Return published assignments for the course."""
        course_id = self.kwargs['course_id']
        return Assignment.objects.filter(course_id=course_id, is_published=True)


class AssignmentDetailAPIView(generics.RetrieveAPIView):
    """Get assignment detail."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AssignmentDetailSerializer
    queryset = Assignment.objects.filter(is_published=True)


class AssignmentSubmitAPIView(generics.CreateAPIView):
    """Submit an assignment."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionStudentSerializer
    
    def post(self, request, pk):
        """Create or update submission."""
        assignment = get_object_or_404(Assignment, id=pk, is_published=True)
        
        # Check enrollment
        is_enrolled = Enrollment.objects.filter(
            student=request.user,
            course=assignment.course
        ).exists()
        
        if not is_enrolled:
            return Response(
                {'detail': 'You must enroll in this course first.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content = request.data.get('content', '')
        
        # Check if submission already exists
        try:
            submission = Submission.objects.get(
                assignment=assignment,
                student=request.user
            )
            # If already graded, cannot modify
            if submission.status == 'graded':
                return Response(
                    {'detail': 'This submission has already been graded and cannot be modified.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Update existing submission
            submission.content = content
            submission.status = 'submitted'
            submission.submitted_at = timezone.now()
            submission.save()
            created = False
        except Submission.DoesNotExist:
            # Create new submission
            submission = Submission.objects.create(
                assignment=assignment,
                student=request.user,
                content=content,
                status='submitted',
                submitted_at=timezone.now()
            )
            created = True
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class AssignmentMySubmissionAPIView(generics.RetrieveAPIView):
    """Get current student's submission for an assignment."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionStudentSerializer
    
    def get_object(self):
        """Return student's submission for this assignment."""
        assignment_id = self.kwargs['pk']
        return get_object_or_404(
            Submission,
            assignment_id=assignment_id,
            student=self.request.user
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_file_view(request):
    """Upload a file and return its URL."""
    if 'file' not in request.FILES:
        return Response(
            {'detail': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Generate unique filename
    file_ext = os.path.splitext(file.name)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Save file to media/uploads directory
    upload_path = f"uploads/{unique_filename}"
    saved_path = default_storage.save(upload_path, ContentFile(file.read()))
    
    # Return URL - use relative path that works with frontend
    # Frontend will handle the base URL
    file_url = f"/media/{saved_path}"
    
    # For production, you might want to return full URL:
    # from django.conf import settings
    # file_url = f"{request.scheme}://{request.get_host()}/media/{saved_path}"
    
    return Response({
        'url': file_url,
        'file_url': file_url,
        'attachment_url': file_url,
        'filename': file.name
    }, status=status.HTTP_201_CREATED)
