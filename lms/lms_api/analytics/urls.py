from django.urls import path
from .views import (
    TeacherAnalyticsSummaryView, 
    TeacherAnalyticsCoursesView,
    TeacherAnalyticsTimeSeriesView,
    TeacherAnalyticsEngagementView
)

urlpatterns = [
    path("teacher/analytics/summary/", TeacherAnalyticsSummaryView.as_view(), name="teacher-analytics-summary"),
    path("teacher/analytics/courses/", TeacherAnalyticsCoursesView.as_view(), name="teacher-analytics-courses"),
    path("teacher/analytics/timeseries/", TeacherAnalyticsTimeSeriesView.as_view(), name="teacher-analytics-timeseries"),
    path("teacher/analytics/engagement/", TeacherAnalyticsEngagementView.as_view(), name="teacher-analytics-engagement"),
]

