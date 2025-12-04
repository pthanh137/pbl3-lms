from rest_framework import serializers
from django.conf import settings
from users.models import User
from .models import (
    Quiz, Question, Choice, StudentQuizAttempt, StudentAnswer,
    Assignment, Submission
)


class ChoiceSerializer(serializers.ModelSerializer):
    """Serializer for Choice (teacher view - includes is_correct)."""
    
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']


class ChoicePublicSerializer(serializers.ModelSerializer):
    """Serializer for Choice (student view - excludes is_correct)."""
    
    class Meta:
        model = Choice
        fields = ['id', 'text']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question (teacher view - includes is_correct in choices)."""
    
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'order', 'choices']


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Serializer for Question (student view - excludes is_correct)."""
    
    choices = ChoicePublicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'order', 'choices']


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for Quiz (list view)."""
    
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'course', 'title', 'description', 'is_published', 'time_limit', 'questions_count']
    
    def get_questions_count(self, obj):
        """Return the count of questions for this quiz."""
        return obj.questions.count()


class QuizDetailTeacherSerializer(serializers.ModelSerializer):
    """Serializer for Quiz detail (teacher view - includes questions with correct answers)."""
    
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'course', 'title', 'description', 'is_published', 'time_limit', 'questions']


class QuizDetailStudentSerializer(serializers.ModelSerializer):
    """Serializer for Quiz detail (student view - excludes correct answers)."""
    
    questions = QuestionPublicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'course', 'title', 'description', 'time_limit', 'questions']


class StudentQuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for StudentQuizAttempt."""
    
    class Meta:
        model = StudentQuizAttempt
        fields = ['id', 'quiz', 'student', 'started_at', 'completed_at', 'score', 'status']
        read_only_fields = ['student', 'started_at', 'completed_at', 'score', 'status']


class StudentAnswerDetailSerializer(serializers.ModelSerializer):
    """Serializer for StudentAnswer with question details."""
    
    question_text = serializers.SerializerMethodField()
    question_id = serializers.SerializerMethodField()
    selected_choice_text = serializers.SerializerMethodField()
    selected_choice_id = serializers.SerializerMethodField()
    is_correct = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentAnswer
        fields = ['id', 'question_id', 'question_text', 'selected_choice_id', 'selected_choice_text', 'is_correct']
    
    def get_question_text(self, obj):
        """Get question text safely."""
        try:
            return obj.question.text if obj.question else None
        except Exception:
            return None
    
    def get_question_id(self, obj):
        """Get question ID safely."""
        try:
            return obj.question.id if obj.question else None
        except Exception:
            return None
    
    def get_selected_choice_text(self, obj):
        """Get selected choice text safely."""
        try:
            return obj.selected_choice.text if obj.selected_choice else None
        except Exception:
            return None
    
    def get_selected_choice_id(self, obj):
        """Get selected choice ID safely."""
        try:
            return obj.selected_choice.id if obj.selected_choice else None
        except Exception:
            return None
    
    def get_is_correct(self, obj):
        """Check if the selected choice is correct."""
        try:
            if obj.selected_choice:
                return obj.selected_choice.is_correct
            return False
        except Exception:
            return False


class StudentInQuizSerializer(serializers.ModelSerializer):
    """Nested serializer for student in quiz submission."""
    
    email = serializers.EmailField(read_only=True)
    avatar = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'avatar', 'email', 'enrolled_count', 'completed_count']
    
    def get_avatar(self, obj):
        """Get avatar URL as absolute URL."""
        try:
            request = self.context.get('request')
            # Check for avatar_url field (URLField) - primary field in User model
            if hasattr(obj, 'avatar_url') and obj.avatar_url:
                url = obj.avatar_url
                if request:
                    # If it's a relative URL, make it absolute
                    if url.startswith('/'):
                        return request.build_absolute_uri(url)
                    return url
                return url
            # Check for avatar field (ImageField) if it exists
            if hasattr(obj, 'avatar') and obj.avatar:
                url = obj.avatar.url
                if request:
                    return request.build_absolute_uri(url)
                return url
            return None
        except Exception:
            return None
    
    def get_enrolled_count(self, obj):
        """Get count of enrolled courses."""
        try:
            from enrollments.models import Enrollment
            return Enrollment.objects.filter(student=obj).count()
        except Exception:
            return 0
    
    def get_completed_count(self, obj):
        """Get count of completed courses (progress = 100%)."""
        try:
            from enrollments.models import Enrollment
            return Enrollment.objects.filter(student=obj, progress_percent=100).count()
        except Exception:
            return 0


class TeacherQuizSubmissionSerializer(serializers.ModelSerializer):
    """Clean serializer for teacher to view quiz submissions.
    
    Returns only serializable fields - no complex objects, no QuerySets.
    """
    
    student = StudentInQuizSerializer(read_only=True)
    student_profile_id = serializers.IntegerField(source='student.id', read_only=True)
    correct_answers = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    time_spent_minutes = serializers.SerializerMethodField()
    time_spent = serializers.SerializerMethodField()  # Add time_spent in seconds
    time_spent_seconds = serializers.IntegerField(read_only=True, allow_null=True)  # Use property from model, can be null
    submitted_at = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentQuizAttempt
        fields = [
            'id',
            'student',
            'student_profile_id',
            'score',
            'correct_answers',
            'total_questions',
            'time_spent_minutes',
            'time_spent',  # Add time_spent in seconds
            'time_spent_seconds',  # Use property from model
            'submitted_at',
        ]
        read_only_fields = ['id', 'score']
    
    def get_correct_answers(self, obj):
        """Count correct answers."""
        if obj.status != 'completed':
            return 0
        try:
            # Use prefetched answers if available, otherwise query
            if hasattr(obj, '_prefetched_objects_cache') and 'answers' in obj._prefetched_objects_cache:
                answers = obj._prefetched_objects_cache['answers']
            else:
                answers = obj.answers.all()
            
            count = sum(1 for answer in answers if answer.selected_choice and answer.selected_choice.is_correct)
            return int(count)
        except Exception:
            return 0
    
    def get_total_questions(self, obj):
        """Get total number of questions in the quiz."""
        try:
            if obj.quiz:
                count = obj.quiz.questions.count()
                return int(count)
            return 0
        except Exception:
            return 0
    
    def get_time_spent_minutes(self, obj):
        """Calculate time spent in minutes using start_time and end_time."""
        try:
            # Use start_time and end_time if available, otherwise fallback to started_at and completed_at
            if obj.start_time and obj.end_time:
                # Ensure we subtract start from end (not reversed)
                delta = obj.end_time - obj.start_time
                total_seconds = max(delta.total_seconds(), 0)  # Never negative
                minutes = round(total_seconds / 60, 1)
                return float(minutes)
            elif obj.completed_at and obj.started_at:
                # Fallback to old fields if new fields are not set
                delta = obj.completed_at - obj.started_at
                total_seconds = max(delta.total_seconds(), 0)  # Never negative
                minutes = round(total_seconds / 60, 1)
                return float(minutes)
            # Return None if no time data available
            return None
        except Exception:
            return None
    
    def get_time_spent(self, obj):
        """Calculate time spent in seconds using start_time and end_time."""
        try:
            # Use start_time and end_time if available, otherwise fallback to started_at and completed_at
            if obj.start_time and obj.end_time:
                # Ensure we subtract start from end (not reversed)
                delta = obj.end_time - obj.start_time
                total_seconds = max(delta.total_seconds(), 0)  # Never negative
                return int(total_seconds)
            elif obj.completed_at and obj.started_at:
                # Fallback to old fields if new fields are not set
                delta = obj.completed_at - obj.started_at
                total_seconds = max(delta.total_seconds(), 0)  # Never negative
                return int(total_seconds)
            # Return None if no time data available (not 0)
            return None
        except Exception:
            return None
    
    def get_submitted_at(self, obj):
        """Get submitted_at as ISO datetime string."""
        try:
            if obj.completed_at:
                # Return ISO format string
                return obj.completed_at.isoformat()
            return None
        except Exception:
            return None


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment (teacher list view)."""
    
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'due_date', 'max_points', 'is_published', 'created_at']


class AssignmentDetailSerializer(serializers.ModelSerializer):
    """Serializer for Assignment detail."""
    
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'due_date', 'max_points', 'is_published', 'attachment_url', 'created_at']


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for Submission (teacher view)."""
    
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'student_email', 'student_name', 'content', 'submitted_at', 'graded_at', 'grade', 'feedback', 'status']
        read_only_fields = ['student', 'submitted_at', 'graded_at', 'status']


class SubmissionStudentSerializer(serializers.ModelSerializer):
    """Serializer for Submission (student view - their own submission)."""
    
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'content', 'submitted_at', 'graded_at', 'grade', 'feedback', 'status']
        read_only_fields = ['assignment', 'submitted_at', 'graded_at', 'grade', 'feedback', 'status']


class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Question."""
    
    class Meta:
        model = Question
        fields = ['text', 'question_type', 'points', 'order']


class ChoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Choice."""
    
    class Meta:
        model = Choice
        fields = ['text', 'is_correct']


class QuizSubmitSerializer(serializers.Serializer):
    """Serializer for quiz submission."""
    
    answers = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    
    def validate_answers(self, value):
        """Validate answers format."""
        if not value:
            raise serializers.ValidationError("Answers cannot be empty.")
        for answer in value:
            if 'question' not in answer or 'selected_choice' not in answer:
                raise serializers.ValidationError("Each answer must have 'question' and 'selected_choice' fields.")
            try:
                int(answer['question'])
                int(answer['selected_choice'])
            except (ValueError, TypeError):
                raise serializers.ValidationError("Question and selected_choice must be integers.")
        return value

