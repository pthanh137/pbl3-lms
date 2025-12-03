from django.contrib import admin
from .models import (
    Quiz, Question, Choice, StudentQuizAttempt, StudentAnswer,
    Assignment, Submission
)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'is_published', 'created_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'course__title']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'quiz', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'quiz']
    search_fields = ['text', 'quiz__title']


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'is_correct']
    list_filter = ['is_correct', 'question__quiz']
    search_fields = ['text', 'question__text']


@admin.register(StudentQuizAttempt)
class StudentQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'status', 'score', 'started_at']
    list_filter = ['status', 'started_at']
    search_fields = ['student__email', 'quiz__title']


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_choice']
    list_filter = ['attempt__quiz']
    search_fields = ['attempt__student__email', 'question__text']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'is_published', 'due_date', 'created_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'course__title']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'assignment', 'status', 'grade', 'submitted_at']
    list_filter = ['status', 'submitted_at']
    search_fields = ['student__email', 'assignment__title']
