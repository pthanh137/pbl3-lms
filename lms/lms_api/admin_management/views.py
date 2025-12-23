from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from users.models import User
from courses.models import Course
from enrollments.models import Enrollment, Payment
from common.permissions import IsAdmin
from .serializers import (
    AdminTeacherSerializer,
    AdminStudentSerializer,
    AdminCourseSerializer,
    AdminRevenueSerializer,
    AdminRevenueAnalyticsSerializer
)


class AdminTeacherViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin view for managing teachers.
    
    GET /api/admin/teachers/ - List all teachers
    GET /api/admin/teachers/{id}/ - Get teacher detail
    PATCH /api/admin/teachers/{id}/approve/ - Approve teacher
    """
    
    queryset = User.objects.filter(role='teacher')
    serializer_class = AdminTeacherSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve a teacher."""
        teacher = get_object_or_404(User, id=pk, role='teacher')
        teacher.is_approved = True
        teacher.save()
        
        serializer = self.get_serializer(teacher)
        return Response({
            'message': 'Teacher approved successfully.',
            'teacher': serializer.data
        }, status=status.HTTP_200_OK)


class AdminStudentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin view for viewing students.
    
    GET /api/admin/students/ - List all students
    GET /api/admin/students/{id}/ - Get student detail
    """
    
    queryset = User.objects.filter(role='student')
    serializer_class = AdminStudentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class AdminCourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin view for viewing courses.
    
    GET /api/admin/courses/ - List all courses
    GET /api/admin/courses/{id}/ - Get course detail
    """
    
    queryset = Course.objects.all().select_related('teacher')
    serializer_class = AdminCourseSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class AdminRevenueAPIView(generics.RetrieveAPIView):
    """
    Admin view for revenue statistics.
    
    GET /api/admin/revenue/ - Get revenue statistics
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request, *args, **kwargs):
        """Return revenue statistics."""
        # Total revenue from all successful payments
        total_revenue_data = Payment.objects.filter(
            status='succeeded'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        total_revenue = total_revenue_data['total'] or 0
        total_payments = total_revenue_data['count'] or 0
        
        # Total unique courses that have been sold
        total_courses_sold = Payment.objects.filter(
            status='succeeded',
            course__isnull=False
        ).values('course').distinct().count()
        
        # Total unique students who made payments
        total_students_paid = Payment.objects.filter(
            status='succeeded'
        ).values('user').distinct().count()
        
        # Revenue by course
        revenue_by_course = (
            Payment.objects
            .filter(status='succeeded', course__isnull=False)
            .values('course__id', 'course__title')
            .annotate(
                revenue=Sum('amount'),
                payment_count=Count('id')
            )
            .order_by('-revenue')[:10]  # Top 10 courses by revenue
        )
        
        revenue_by_course_list = [
            {
                'course_id': item['course__id'],
                'course_title': item['course__title'],
                'revenue': float(item['revenue']),
                'payment_count': item['payment_count']
            }
            for item in revenue_by_course
        ]
        
        # Recent payments (last 10)
        recent_payments = Payment.objects.filter(
            status='succeeded'
        ).select_related('user', 'course').order_by('-created_at')[:10]
        
        recent_payments_list = [
            {
                'id': payment.id,
                'reference_code': payment.reference_code,
                'user_email': payment.user.email,
                'user_name': payment.user.full_name or '',
                'course_id': payment.course.id if payment.course else None,
                'course_title': payment.course.title if payment.course else None,
                'amount': float(payment.amount),
                'currency': payment.currency,
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
            }
            for payment in recent_payments
        ]
        
        data = {
            'total_revenue': float(total_revenue),
            'total_payments': total_payments,
            'total_courses_sold': total_courses_sold,
            'total_students_paid': total_students_paid,
            'revenue_by_course': revenue_by_course_list,
            'recent_payments': recent_payments_list,
        }
        
        serializer = AdminRevenueSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminRevenueAnalyticsAPIView(generics.RetrieveAPIView):
    """
    Admin view for revenue analytics data (for charts).
    
    GET /api/admin/revenue/analytics/ - Get analytics data for charts
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request, *args, **kwargs):
        """Return analytics data for charts."""
        from django.db.models.functions import TruncDate, TruncMonth
        from datetime import datetime, timedelta
        
        # 1. Revenue by time (last 30 days, grouped by day)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        revenue_by_time = (
            Payment.objects
            .filter(status='succeeded', created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('amount'), count=Count('id'))
            .order_by('date')
        )
        
        revenue_by_time_list = [
            {
                'date': item['date'].isoformat() if item['date'] else None,
                'revenue': float(item['revenue']),
                'count': item['count']
            }
            for item in revenue_by_time
        ]
        
        # 2. Revenue by course (top 10, same as revenue_by_course but formatted for chart)
        revenue_by_course = (
            Payment.objects
            .filter(status='succeeded', course__isnull=False)
            .values('course__id', 'course__title')
            .annotate(
                revenue=Sum('amount'),
                payment_count=Count('id')
            )
            .order_by('-revenue')[:10]
        )
        
        revenue_by_course_list = [
            {
                'course_id': item['course__id'],
                'course_title': item['course__title'] or 'Unknown Course',
                'revenue': float(item['revenue']),
                'payment_count': item['payment_count']
            }
            for item in revenue_by_course
        ]
        
        # 3. Payment ratio (paid vs unpaid students)
        total_students = User.objects.filter(role='student').count()
        
        # Students with at least one paid enrollment
        paid_students = Enrollment.objects.filter(
            enrollment_type='paid'
        ).values('student').distinct().count()
        
        # Students with only audit enrollments (or no enrollments)
        unpaid_students = total_students - paid_students
        
        payment_ratio_list = [
            {
                'name': 'Paid Students',
                'value': paid_students,
                'percentage': round((paid_students / total_students * 100), 2) if total_students > 0 else 0
            },
            {
                'name': 'Unpaid/Free Students',
                'value': unpaid_students,
                'percentage': round((unpaid_students / total_students * 100), 2) if total_students > 0 else 0
            }
        ]
        
        data = {
            'revenue_by_time': revenue_by_time_list,
            'revenue_by_course': revenue_by_course_list,
            'payment_ratio': payment_ratio_list,
        }
        
        serializer = AdminRevenueAnalyticsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

