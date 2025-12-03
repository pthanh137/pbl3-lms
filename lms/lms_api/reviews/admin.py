from django.contrib import admin
from .models import CourseReview


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'course', 'user', 'rating', 'created_at', 'updated_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['course__title', 'user__email', 'user__full_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
