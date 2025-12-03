from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from .models import CourseReview
from .serializers import (
    CourseReviewSerializer,
    CourseReviewCreateUpdateSerializer,
    CourseRatingSummarySerializer,
)
from courses.models import Course
from enrollments.models import Enrollment


class CourseReviewListCreateAPIView(generics.ListCreateAPIView):
    """
    List all reviews for a course and create/update current user's review.
    
    GET /api/courses/<int:course_id>/reviews/ - List all reviews (AllowAny)
    POST /api/courses/<int:course_id>/reviews/ - Create or update current user's review (IsAuthenticated)
    
    Flow:
    - Student enrolls a course
    - After learning, they call POST /api/courses/{course_id}/reviews/ with rating + comment
    - They can later update using the same endpoint (if review exists, it updates)
    """
    
    serializer_class = CourseReviewSerializer
    
    def get_permissions(self):
        """GET: AllowAny, POST: IsAuthenticated"""
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """Return all reviews for the specified course, ordered by created_at desc."""
        course_id = self.kwargs['course_id']
        return CourseReview.objects.filter(
            course_id=course_id,
            course__is_published=True
        ).select_related('user', 'course').order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Create or update current user's review for a course.
        
        If user already has a review for this course, update it.
        Otherwise, create a new review.
        
        User must be enrolled in the course to create/update a review.
        """
        course_id = self.kwargs['course_id']
        course = get_object_or_404(Course, id=course_id, is_published=True)
        
        # Check if user is enrolled in the course
        is_enrolled = Enrollment.objects.filter(
            student=request.user,
            course=course
        ).exists()
        
        if not is_enrolled:
            return Response(
                {'detail': 'You must enroll in this course before leaving a review.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if review already exists
        try:
            review = CourseReview.objects.get(course=course, user=request.user)
            # Update existing review
            serializer = CourseReviewCreateUpdateSerializer(review, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(CourseReviewSerializer(review).data, status=status.HTTP_200_OK)
        except CourseReview.DoesNotExist:
            # Create new review
            serializer = CourseReviewCreateUpdateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            review = serializer.save(course=course, user=request.user)
            return Response(CourseReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class CourseReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a single review by id.
    
    GET /api/reviews/<int:pk>/ - Get review (AllowAny)
    PUT /api/reviews/<int:pk>/ - Update review (IsAuthenticated, owner only)
    PATCH /api/reviews/<int:pk>/ - Partial update review (IsAuthenticated, owner only)
    DELETE /api/reviews/<int:pk>/ - Delete review (IsAuthenticated, owner only)
    """
    
    queryset = CourseReview.objects.all().select_related('user', 'course')
    serializer_class = CourseReviewSerializer
    
    def get_permissions(self):
        """GET: AllowAny, PUT/PATCH/DELETE: IsAuthenticated"""
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        """Use different serializer for update."""
        if self.request.method in ['PUT', 'PATCH']:
            return CourseReviewCreateUpdateSerializer
        return CourseReviewSerializer
    
    def get_object(self):
        """Get review and check ownership for update/delete."""
        review = super().get_object()
        
        # For PUT/PATCH/DELETE, ensure user owns the review
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if review.user != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update or delete your own reviews.")
        
        return review


class CourseRatingSummaryAPIView(generics.GenericAPIView):
    """
    Get rating summary for a course.
    
    GET /api/courses/<int:course_id>/rating-summary/
    
    Returns:
    {
        "average_rating": 4.7,
        "total_reviews": 123
    }
    
    If no reviews:
    {
        "average_rating": 0.0,
        "total_reviews": 0
    }
    
    Used on CourseDetail page to display average rating + total reviews.
    """
    
    permission_classes = [permissions.AllowAny]
    serializer_class = CourseRatingSummarySerializer
    
    def get(self, request, course_id):
        """Calculate and return rating summary."""
        course = get_object_or_404(Course, id=course_id, is_published=True)
        
        # Aggregate reviews for this course
        result = CourseReview.objects.filter(course=course).aggregate(
            average_rating=Avg('rating'),
            total_reviews=Count('id')
        )
        
        # Format response
        data = {
            'average_rating': round(result['average_rating'], 2) if result['average_rating'] else 0.0,
            'total_reviews': result['total_reviews'] or 0
        }
        
        serializer = self.get_serializer(data)
        return Response(serializer.data)


class MyCourseReviewAPIView(generics.RetrieveAPIView):
    """
    Get current user's review for a specific course.
    
    GET /api/courses/<int:course_id>/my-review/
    
    Returns:
    - 200: Review found (CourseReviewSerializer)
    - 404: Review not found (user hasn't reviewed this course yet)
    - 401: Not authenticated
    
    Used on CourseDetail page to prefill review form.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseReviewSerializer
    
    def get_object(self):
        """Get current user's review for the course."""
        course_id = self.kwargs['course_id']
        course = get_object_or_404(Course, id=course_id, is_published=True)
        
        try:
            return CourseReview.objects.get(course=course, user=self.request.user)
        except CourseReview.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("You have not reviewed this course yet.")
