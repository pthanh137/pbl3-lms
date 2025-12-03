from rest_framework import serializers
from .models import CourseReview
from users.models import User


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user representation for reviews."""
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email']
        read_only_fields = ['id', 'full_name', 'email']


class CourseReviewSerializer(serializers.ModelSerializer):
    """Serializer for CourseReview (list/detail view)."""
    
    user = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = CourseReview
        fields = [
            'id',
            'course',
            'user',
            'rating',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'course', 'user', 'created_at', 'updated_at']


class CourseReviewCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating CourseReview."""
    
    class Meta:
        model = CourseReview
        fields = [
            'rating',
            'comment',
        ]
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class CourseRatingSummarySerializer(serializers.Serializer):
    """Serializer for course rating summary."""
    
    average_rating = serializers.FloatField(allow_null=True)
    total_reviews = serializers.IntegerField()

