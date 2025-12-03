from rest_framework import serializers
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

