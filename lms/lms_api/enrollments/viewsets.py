from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Enrollment, LessonProgress
from .serializers import (
    EnrollmentSerializer,
    EnrollmentCreateSerializer,
    LessonProgressSerializer
)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Enrollment model."""
    
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get current user's enrollments."""
        if request.user.is_authenticated:
            enrollments = Enrollment.objects.filter(student=request.user)
            serializer = self.get_serializer(enrollments, many=True)
            return Response(serializer.data)
        return Response(
            {'detail': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LessonProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for LessonProgress model."""
    
    queryset = LessonProgress.objects.all()
    serializer_class = LessonProgressSerializer

