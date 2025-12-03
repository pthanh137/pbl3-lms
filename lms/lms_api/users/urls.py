from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .viewsets import UserViewSet
from .auth_views import RegisterView, CustomTokenObtainPairView, MeAPIView, InstructorPublicProfileAPIView, TopInstructorsAPIView

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', MeAPIView.as_view(), name='auth-me'),
    # Instructor public profile
    path('instructors/<int:instructor_id>/profile/', InstructorPublicProfileAPIView.as_view(), name='instructor-public-profile'),
    path('instructors/top/', TopInstructorsAPIView.as_view(), name='top-instructors'),
    # User endpoints (existing)
    path('', include(router.urls)),
]

