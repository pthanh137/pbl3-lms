"""
URL configuration for lms_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.auth_views import RegisterView, CustomTokenObtainPairView, MeAPIView, StudentPublicProfileAPIView, ChangePasswordAPIView
from enrollments.views import StudentMyCoursesAPIView, TeacherCourseStudentsView, RemoveStudentFromCourseView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth endpoints at /api/auth/
    path('api/auth/register/', RegisterView.as_view(), name='auth-register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('api/auth/me/', MeAPIView.as_view(), name='auth-me'),
    path('api/auth/change-password/', ChangePasswordAPIView.as_view(), name='auth-change-password'),
    # Other API endpoints
    path('api/users/', include('users.urls')),
    path('api/', include('courses.urls')),
    path('api/enrollments/', include('enrollments.urls')),
    path('api/', include('assessments.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('analytics.urls')),
    path('api/', include('messaging.urls')),
    path('api/', include('announcements.urls')),
    # Student endpoints
    path('api/student/my-courses/', StudentMyCoursesAPIView.as_view(), name='student-my-courses'),
    # Student public profile
    path('api/students/<int:student_id>/profile/', StudentPublicProfileAPIView.as_view(), name='student-public-profile'),
    # Teacher course student management
    path(
        'api/teacher/courses/<int:course_id>/students/',
        TeacherCourseStudentsView.as_view(),
        name='teacher-course-students'
    ),
    path(
        'api/teacher/courses/<int:course_id>/students/<int:student_id>/',
        RemoveStudentFromCourseView.as_view(),
        name='teacher-course-student-remove'
    ),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

