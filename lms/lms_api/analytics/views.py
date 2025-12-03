from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Count, Avg, Max, Sum, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta, datetime, timezone as dt_timezone
from courses.models import Course
from enrollments.models import Enrollment, Certificate, LessonProgress
from reviews.models import CourseReview
from assessments.models import StudentQuizAttempt, Submission
from common.permissions import IsTeacher
from .serializers import (
    TeacherAnalyticsSummarySerializer,
    TeacherCourseStatsSerializer,
)


class TeacherAnalyticsSummaryView(generics.GenericAPIView):
    """
    Get summary analytics for the current authenticated teacher.
    
    GET /api/teacher/analytics/summary/
    
    Returns:
    - total_courses: Total number of courses owned by teacher
    - total_enrollments: Sum of enrollments across all teacher's courses
    - total_students: Distinct students enrolled in teacher's courses
    - average_rating: Average rating across all teacher's courses
    - total_reviews: Total number of reviews for teacher's courses
    
    Test Flow:
    1) Create some courses owned by a teacher.
    2) Enroll multiple students into those courses.
    3) Add some reviews (CourseReview).
    4) Call GET /api/teacher/analytics/summary/ with teacher's JWT.
    5) Verify counts and averages match the data in DB.
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def get(self, request, *args, **kwargs):
        """Return summary analytics for the current teacher."""
        # Get all courses owned by this teacher
        teacher_courses = Course.objects.filter(teacher=request.user)
        
        # Compute summary statistics
        total_courses = teacher_courses.count()
        
        # Total enrollments across all teacher's courses
        total_enrollments = Enrollment.objects.filter(
            course__in=teacher_courses
        ).count()
        
        # Distinct students enrolled in teacher's courses
        total_students = Enrollment.objects.filter(
            course__in=teacher_courses
        ).values("student").distinct().count()
        
        # Rating aggregation
        rating_agg = CourseReview.objects.filter(
            course__in=teacher_courses
        ).aggregate(
            average_rating=Avg("rating"),
            total_reviews=Count("id"),
        )
        
        # Enrollment type aggregation
        enrollment_agg = Enrollment.objects.filter(
            course__in=teacher_courses
        ).aggregate(
            total_paid_enrollments=Count("id", filter=Q(enrollment_type="paid")),
            total_audit_enrollments=Count("id", filter=Q(enrollment_type="audit")),
            total_revenue=Sum("price_paid", filter=Q(enrollment_type="paid")),
        )
        
        # Certificates count
        total_certificates_issued = Certificate.objects.filter(
            course__in=teacher_courses
        ).count()
        
        # Build summary dict
        summary_data = {
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "total_students": total_students,
            "average_rating": rating_agg["average_rating"] if rating_agg["average_rating"] is not None else 0.0,
            "total_reviews": rating_agg["total_reviews"] or 0,
            "total_paid_enrollments": enrollment_agg["total_paid_enrollments"] or 0,
            "total_audit_enrollments": enrollment_agg["total_audit_enrollments"] or 0,
            "total_revenue": enrollment_agg["total_revenue"] or 0,
            "total_certificates_issued": total_certificates_issued,
        }
        
        # Serialize and return
        serializer = TeacherAnalyticsSummarySerializer(summary_data)
        return Response(serializer.data)


class TeacherAnalyticsCoursesView(generics.GenericAPIView):
    """
    Get per-course analytics stats for the current authenticated teacher.
    
    GET /api/teacher/analytics/courses/
    
    Returns a list of course stats, each containing:
    - course_id: Course ID
    - course_title: Course title
    - course_thumbnail: Course thumbnail URL (if exists)
    - enrollments_count: Number of enrollments
    - unique_students_count: Number of distinct students
    - average_rating: Average rating for this course
    - total_reviews: Total number of reviews
    - created_at: Course creation date
    - last_enrollment_at: Most recent enrollment date (if any)
    - status: "published" or "draft" based on is_published field
    
    Test Flow:
    1) Create some courses owned by a teacher.
    2) Enroll multiple students into those courses.
    3) Add some reviews (CourseReview).
    4) Call GET /api/teacher/analytics/courses/ with teacher's JWT.
    5) Verify counts and averages match the data in DB.
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def get(self, request, *args, **kwargs):
        """Return per-course analytics for the current teacher."""
        # Get teacher's courses with aggregated stats
        courses_stats = (
            Course.objects
            .filter(teacher=request.user)
            .annotate(
                enrollments_count=Count("enrollments", distinct=True),
                unique_students_count=Count("enrollments__student", distinct=True),
                average_rating=Avg("reviews__rating"),
                total_reviews=Count("reviews", distinct=True),
                last_enrollment_at=Max("enrollments__created_at"),
                paid_enrollments=Count("enrollments", filter=Q(enrollments__enrollment_type="paid"), distinct=True),
                audit_enrollments=Count("enrollments", filter=Q(enrollments__enrollment_type="audit"), distinct=True),
                revenue=Sum("enrollments__price_paid", filter=Q(enrollments__enrollment_type="paid")),
                certificates_issued=Count("certificates", distinct=True),
            )
            .order_by("-created_at")
        )
        
        # Build list of course stats dicts
        courses_data = []
        for course in courses_stats:
            course_data = {
                "course_id": course.id,
                "course_title": course.title,
                "course_thumbnail": course.thumbnail_url if course.thumbnail_url else None,
                "enrollments_count": course.enrollments_count or 0,
                "unique_students_count": course.unique_students_count or 0,
                "average_rating": course.average_rating if course.average_rating is not None else 0.0,
                "total_reviews": course.total_reviews or 0,
                "created_at": course.created_at,
                "last_enrollment_at": course.last_enrollment_at,
                "status": "published" if course.is_published else "draft",
                "paid_enrollments": course.paid_enrollments or 0,
                "audit_enrollments": course.audit_enrollments or 0,
                "revenue": float(course.revenue) if course.revenue else 0.0,
                "certificates_issued": course.certificates_issued or 0,
            }
            courses_data.append(course_data)
        
        # Serialize and return
        serializer = TeacherCourseStatsSerializer(courses_data, many=True)
        return Response(serializer.data)


class TeacherAnalyticsTimeSeriesView(APIView):
    """
    Get time-series analytics for charts (monthly stats).
    
    GET /api/teacher/analytics/timeseries/?months=6
    
    Query Parameters:
    - months: Number of months to include (default: 6)
    
    Returns monthly stats for last N months:
    [
      {
        "month": "2025-06",
        "paid_enrollments": 10,
        "audit_enrollments": 4,
        "revenue": 199.99
      },
      ...
    ]
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def get(self, request, *args, **kwargs):
        """Return time-series analytics."""
        # Get months parameter (default 6)
        months = int(request.query_params.get('months', 6))
        
        # Get teacher's courses
        teacher_courses = Course.objects.filter(teacher=request.user)
        
        # Generate list of last N months (including current month)
        now = timezone.now()
        month_list = []
        for i in range(months - 1, -1, -1):
            # Calculate the month (i months ago from current month)
            # Use date manipulation to go back months properly
            if i == 0:
                # Current month
                target_date = now
            else:
                # Go back i months
                year = now.year
                month = now.month - i
                while month <= 0:
                    month += 12
                    year -= 1
                # Use first day of that month
                target_date = datetime(year, month, 1, tzinfo=dt_timezone.utc)
            
            month_key = target_date.strftime("%Y-%m")
            month_start = datetime(target_date.year, target_date.month, 1, tzinfo=dt_timezone.utc)
            month_list.append({
                "month_key": month_key,
                "month_start": month_start,
            })
        
        # Get enrollments for teacher's courses from the earliest month
        if month_list:
            earliest_month = month_list[0]["month_start"]
            enrollments = Enrollment.objects.filter(
                course__in=teacher_courses,
                created_at__gte=earliest_month
            )
        else:
            enrollments = Enrollment.objects.filter(course__in=teacher_courses)
        
        # Group by month and aggregate
        monthly_stats_dict = {}
        for stat in (
            enrollments
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                paid_enrollments=Count("id", filter=Q(enrollment_type="paid")),
                audit_enrollments=Count("id", filter=Q(enrollment_type="audit")),
                revenue=Sum("price_paid", filter=Q(enrollment_type="paid")),
            )
        ):
            month_key = stat["month"].strftime("%Y-%m")
            monthly_stats_dict[month_key] = {
                "paid_enrollments": stat["paid_enrollments"] or 0,
                "audit_enrollments": stat["audit_enrollments"] or 0,
                "revenue": float(stat["revenue"]) if stat["revenue"] else 0.0,
            }
        
        # Build result with all months (fill missing months with zeros)
        result = []
        for month_info in month_list:
            month_key = month_info["month_key"]
            if month_key in monthly_stats_dict:
                result.append({
                    "month": month_key,
                    "paid_enrollments": monthly_stats_dict[month_key]["paid_enrollments"],
                    "audit_enrollments": monthly_stats_dict[month_key]["audit_enrollments"],
                    "revenue": monthly_stats_dict[month_key]["revenue"],
                })
            else:
                result.append({
                    "month": month_key,
                    "paid_enrollments": 0,
                    "audit_enrollments": 0,
                    "revenue": 0.0,
                })
        
        return Response(result, status=status.HTTP_200_OK)


class TeacherAnalyticsEngagementView(APIView):
    """
    Get engagement metrics for the current authenticated teacher.
    
    GET /api/teacher/analytics/engagement/
    
    Returns:
    {
        "lessons_completed": 123,
        "completion_rate": 42.5,
        "quiz_attempts": 45,
        "assignments_submitted": 30
    }
    """
    
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    
    def get(self, request, *args, **kwargs):
        """Return engagement metrics for the current teacher."""
        # Get teacher's courses
        teacher_courses = Course.objects.filter(teacher=request.user)
        
        # Get enrollments for teacher's courses
        teacher_enrollments = Enrollment.objects.filter(course__in=teacher_courses)
        
        # 1. Lessons Completed: Count LessonProgress with is_completed=True
        lessons_completed = LessonProgress.objects.filter(
            enrollment__in=teacher_enrollments,
            is_completed=True
        ).count()
        
        # 2. Average Completion Rate
        # Get paid enrollments
        paid_enrollments = teacher_enrollments.filter(enrollment_type='paid')
        paid_enrollments_count = paid_enrollments.count()
        
        # Count completed enrollments (progress_percent = 100)
        completed_enrollments = paid_enrollments.filter(progress_percent=100).count()
        
        # Calculate completion rate
        if paid_enrollments_count > 0:
            completion_rate = (completed_enrollments / paid_enrollments_count) * 100
        else:
            completion_rate = 0.0
        
        # 3. Quiz Attempts: Count StudentQuizAttempt for quizzes in teacher's courses
        quiz_attempts = StudentQuizAttempt.objects.filter(
            quiz__course__in=teacher_courses
        ).count()
        
        # 4. Assignments Submitted: Count Submission for assignments in teacher's courses
        assignments_submitted = Submission.objects.filter(
            assignment__course__in=teacher_courses
        ).count()
        
        return Response({
            "lessons_completed": lessons_completed,
            "completion_rate": round(completion_rate, 1),
            "quiz_attempts": quiz_attempts,
            "assignments_submitted": assignments_submitted,
        }, status=status.HTTP_200_OK)

