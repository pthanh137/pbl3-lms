from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseCurriculumAPIView, LessonDetailAPIView, CourseCategoriesListAPIView
from .teacher_views import TeacherCourseViewSet, TeacherSectionViewSet, TeacherLessonViewSet
from enrollments.views import (
    EnrollCourseAPIView, 
    CompleteLessonAPIView,
    PurchaseCourseAPIView,
    IssueCertificateAPIView,
    MyCertificateAPIView,
    MyCertificatesListAPIView
)

# Public router
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')

# Teacher router
teacher_router = DefaultRouter()
teacher_router.register(r'teacher/courses', TeacherCourseViewSet, basename='teacher-courses')
teacher_router.register(r'teacher/sections', TeacherSectionViewSet, basename='teacher-sections')
teacher_router.register(r'teacher/lessons', TeacherLessonViewSet, basename='teacher-lessons')

urlpatterns = [
    # Public endpoints
    path('courses/categories/', CourseCategoriesListAPIView.as_view(), name='course-categories'),
    path('courses/<int:pk>/curriculum/', CourseCurriculumAPIView.as_view(), name='course-curriculum'),
    path('courses/<int:course_id>/enroll/', EnrollCourseAPIView.as_view(), name='course-enroll'),
    path('courses/<int:course_id>/purchase/', PurchaseCourseAPIView.as_view(), name='course-purchase'),
    path('courses/<int:course_id>/certificate/issue/', IssueCertificateAPIView.as_view(), name='certificate-issue'),
    path('courses/<int:course_id>/certificate/me/', MyCertificateAPIView.as_view(), name='certificate-me'),
    path('lessons/<int:pk>/', LessonDetailAPIView.as_view(), name='lesson-detail'),
    path('lessons/<int:lesson_id>/complete/', CompleteLessonAPIView.as_view(), name='lesson-complete'),
    # Include routers
    path('', include(router.urls)),
    path('', include(teacher_router.urls)),
]

