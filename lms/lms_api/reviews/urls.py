from django.urls import path
from .views import (
    CourseReviewListCreateAPIView,
    CourseReviewDetailAPIView,
    CourseRatingSummaryAPIView,
    MyCourseReviewAPIView,
)

urlpatterns = [
    # List all reviews for a course and create/update current user's review
    path('courses/<int:course_id>/reviews/', CourseReviewListCreateAPIView.as_view(), name='course-reviews-list-create'),
    
    # Get rating summary for a course
    path('courses/<int:course_id>/rating-summary/', CourseRatingSummaryAPIView.as_view(), name='course-rating-summary'),
    
    # Get current user's review for a specific course
    path('courses/<int:course_id>/my-review/', MyCourseReviewAPIView.as_view(), name='course-my-review'),
    
    # Get, update, or delete a single review by id
    path('reviews/<int:pk>/', CourseReviewDetailAPIView.as_view(), name='review-detail'),
]
