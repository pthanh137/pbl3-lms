from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Teacher Quiz
    TeacherQuizViewSet,
    QuestionCreateAPIView,
    QuestionDetailAPIView,
    ChoiceCreateAPIView,
    ChoiceDetailAPIView,
    # Student Quiz
    CourseQuizzesListAPIView,
    QuizDetailAPIView,
    QuizStartAPIView,
    QuizSubmitAPIView,
    QuizAttemptsMeAPIView,
    # Teacher Assignment
    TeacherAssignmentViewSet,
    SubmissionGradeAPIView,
    # Student Assignment
    CourseAssignmentsListAPIView,
    AssignmentDetailAPIView,
    AssignmentSubmitAPIView,
    AssignmentMySubmissionAPIView,
    # File Upload
    upload_file_view,
)

# Teacher router
teacher_router = DefaultRouter()
teacher_router.register(r'teacher/quizzes', TeacherQuizViewSet, basename='teacher-quizzes')
teacher_router.register(r'teacher/assignments', TeacherAssignmentViewSet, basename='teacher-assignments')

urlpatterns = [
    # Include teacher router
    path('', include(teacher_router.urls)),
    
    # Teacher Quiz Management
    path('teacher/quizzes/<int:quiz_id>/questions/', QuestionCreateAPIView.as_view(), name='question-create'),
    path('teacher/questions/<int:pk>/', QuestionDetailAPIView.as_view(), name='question-detail'),
    path('teacher/questions/<int:question_id>/choices/', ChoiceCreateAPIView.as_view(), name='choice-create'),
    path('teacher/choices/<int:pk>/', ChoiceDetailAPIView.as_view(), name='choice-detail'),
    
    # Teacher Assignment Management
    path('teacher/assignments/<int:pk>/submissions/', TeacherAssignmentViewSet.as_view({'get': 'submissions'}), name='assignment-submissions'),
    path('teacher/submissions/<int:pk>/grade/', SubmissionGradeAPIView.as_view(), name='submission-grade'),
    
    # Student Quiz
    path('courses/<int:course_id>/quizzes/', CourseQuizzesListAPIView.as_view(), name='course-quizzes'),
    path('quizzes/<int:pk>/', QuizDetailAPIView.as_view(), name='quiz-detail'),
    path('quizzes/<int:pk>/start/', QuizStartAPIView.as_view(), name='quiz-start'),
    path('quizzes/<int:pk>/submit/', QuizSubmitAPIView.as_view(), name='quiz-submit'),
    path('quizzes/<int:pk>/attempts/me/', QuizAttemptsMeAPIView.as_view(), name='quiz-attempts-me'),
    
    # Student Assignment
    path('courses/<int:course_id>/assignments/', CourseAssignmentsListAPIView.as_view(), name='course-assignments'),
    path('assignments/<int:pk>/', AssignmentDetailAPIView.as_view(), name='assignment-detail'),
    path('assignments/<int:pk>/submit/', AssignmentSubmitAPIView.as_view(), name='assignment-submit'),
    path('assignments/<int:pk>/my-submission/', AssignmentMySubmissionAPIView.as_view(), name='assignment-my-submission'),
    
    # File Upload
    path('upload/', upload_file_view, name='upload-file'),
]

