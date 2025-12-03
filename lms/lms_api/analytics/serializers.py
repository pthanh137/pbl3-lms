from rest_framework import serializers


class TeacherAnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for teacher analytics summary."""
    
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    total_students = serializers.IntegerField()
    average_rating = serializers.FloatField(allow_null=True)
    total_reviews = serializers.IntegerField()
    total_paid_enrollments = serializers.IntegerField()
    total_audit_enrollments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_certificates_issued = serializers.IntegerField()


class TeacherCourseStatsSerializer(serializers.Serializer):
    """Serializer for per-course analytics stats."""
    
    course_id = serializers.IntegerField()
    course_title = serializers.CharField()
    course_thumbnail = serializers.URLField(allow_null=True, allow_blank=True)
    enrollments_count = serializers.IntegerField()
    unique_students_count = serializers.IntegerField()
    average_rating = serializers.FloatField(allow_null=True)
    total_reviews = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    last_enrollment_at = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()
    paid_enrollments = serializers.IntegerField()
    audit_enrollments = serializers.IntegerField()
    revenue = serializers.FloatField()
    certificates_issued = serializers.IntegerField()

