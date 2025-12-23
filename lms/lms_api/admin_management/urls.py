from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminTeacherViewSet,
    AdminStudentViewSet,
    AdminCourseViewSet,
    AdminRevenueAPIView,
    AdminRevenueAnalyticsAPIView
)

router = DefaultRouter()
router.register(r'teachers', AdminTeacherViewSet, basename='admin-teachers')
router.register(r'students', AdminStudentViewSet, basename='admin-students')
router.register(r'courses', AdminCourseViewSet, basename='admin-courses')

urlpatterns = [
    path('revenue/', AdminRevenueAPIView.as_view(), name='admin-revenue'),
    path('revenue/analytics/', AdminRevenueAnalyticsAPIView.as_view(), name='admin-revenue-analytics'),
    path('', include(router.urls)),
]

