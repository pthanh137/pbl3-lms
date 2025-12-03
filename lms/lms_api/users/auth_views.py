from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer, RegisterSerializer, StudentPublicProfileSerializer, InstructorPublicProfileSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.
    
    POST /api/auth/register/
    Body: {
        "email": "user@example.com",
        "password": "password123",
        "password_confirm": "password123",
        "full_name": "John Doe",
        "role": "student"
    }
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that uses email instead of username.
    
    POST /api/auth/login/
    Body: {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    def post(self, request, *args, **kwargs):
        # SimpleJWT expects 'username' field, but we use 'email'
        # So we need to map email to username
        if 'email' in request.data:
            request.data['username'] = request.data['email']
        return super().post(request, *args, **kwargs)


class MeAPIView(generics.RetrieveAPIView):
    """
    Get current authenticated user information.
    
    GET /api/auth/me/
    Headers: Authorization: Bearer <access_token>
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class StudentPublicProfileAPIView(APIView):
    """
    Get public profile of a student (no authentication required).
    
    GET /api/students/<student_id>/profile/
    
    Returns:
    - Basic student information (id, full_name, avatar_url, bio, country, language, social_links)
    - Statistics (total_enrolled_courses, total_completed_courses, total_reviews, etc.)
    - List of enrolled courses with progress information
    """
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, student_id):
        """Return public profile of the student."""
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = StudentPublicProfileSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstructorPublicProfileAPIView(APIView):
    """
    Get public profile of an instructor (no authentication required).
    
    GET /api/instructors/<instructor_id>/profile/
    
    Returns:
    - Basic instructor information (id, full_name, headline, bio, avatar_url, country, social_links)
    - Statistics (total_students, total_enrollments, total_reviews, average_rating, total_courses, member_since)
    - List of courses taught by this instructor with ratings and student counts
    """
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, instructor_id):
        """Return public profile of the instructor."""
        try:
            instructor = User.objects.get(id=instructor_id, role='teacher')
        except User.DoesNotExist:
            return Response(
                {"detail": "Instructor not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = InstructorPublicProfileSerializer(instructor)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TopInstructorsAPIView(APIView):
    """
    Get top instructors by students count or rating.
    
    GET /api/instructors/top/?sort=students (default)
    GET /api/instructors/top/?sort=rating
    
    Returns list of top 10 instructors with:
    - id, full_name, headline, avatar_url
    - total_courses, total_students, average_rating, total_reviews
    """
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Return top instructors sorted by students or rating."""
        from courses.models import Course
        from enrollments.models import Enrollment
        from reviews.models import CourseReview
        from django.db.models import Avg, Count
        
        # Get all teachers with published courses
        teachers = User.objects.filter(
            role='teacher',
            courses__is_published=True
        ).distinct()
        
        instructors_data = []
        for teacher in teachers:
            courses = Course.objects.filter(teacher=teacher, is_published=True)
            
            if courses.count() == 0:
                continue
            
            # Calculate stats
            total_students = Enrollment.objects.filter(
                course__in=courses
            ).values('student').distinct().count()
            
            rating_data = CourseReview.objects.filter(
                course__in=courses
            ).aggregate(
                avg_rating=Avg('rating'),
                total_reviews=Count('id')
            )
            
            instructors_data.append({
                'id': teacher.id,
                'full_name': teacher.full_name or teacher.email,
                'headline': teacher.headline or '',
                'avatar_url': teacher.avatar_url,
                'total_courses': courses.count(),
                'total_students': total_students,
                'average_rating': round(rating_data['avg_rating'] or 0, 2),
                'total_reviews': rating_data['total_reviews'] or 0,
            })
        
        # Sort by parameter
        sort_by = request.query_params.get('sort', 'students')  # 'students' or 'rating'
        if sort_by == 'rating':
            instructors_data.sort(key=lambda x: (x['average_rating'], x['total_students']), reverse=True)
        else:
            instructors_data.sort(key=lambda x: (x['total_students'], x['average_rating']), reverse=True)
        
        # Return top 10
        return Response({
            'instructors': instructors_data[:10]
        })


class ChangePasswordAPIView(APIView):
    """
    Change password for authenticated users.
    
    POST /api/auth/change-password/
    Body: {
        "old_password": "current_password",
        "new_password": "new_password"
    }
    Headers: Authorization: Bearer <access_token>
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Change user password."""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # Validate required fields
        if not old_password:
            return Response(
                {'old_password': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_password:
            return Response(
                {'new_password': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check old password
        if not user.check_password(old_password):
            return Response(
                {'old_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'new_password': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new password is same as old password
        if user.check_password(new_password):
            return Response(
                {'new_password': ['New password must be different from current password.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'detail': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )




