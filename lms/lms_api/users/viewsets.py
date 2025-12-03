from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import UserSerializer, UserRegisterSerializer, ProfileSerializer


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegisterSerializer
        return UserSerializer
    
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """Register a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get current user information."""
        if request.user.is_authenticated:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        return Response(
            {'detail': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    @action(detail=True, methods=['get'], url_path='profile', permission_classes=[AllowAny])
    def profile(self, request, pk=None):
        """
        Get public profile of a user.
        GET /api/users/<id>/profile/
        """
        user = get_object_or_404(User, id=pk)
        serializer = ProfileSerializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me/profile', permission_classes=[IsAuthenticated])
    def my_profile(self, request):
        """
        Get or update current user's profile.
        GET /api/users/me/profile/ - Get current user profile
        PUT/PATCH /api/users/me/profile/ - Update current user profile
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = ProfileSerializer(user)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = ProfileSerializer(user, data=request.data, partial=request.method == 'PATCH')
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

