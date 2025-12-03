from django.urls import path
from .views import (
    SendAnnouncementAPIView,
    SentAnnouncementsListAPIView,
    AnnouncementDetailAPIView,
    CourseAnnouncementsListAPIView,
    MyAnnouncementsListAPIView,
    mark_announcement_read,
)

app_name = 'announcements'

urlpatterns = [
    path('announcements/send/', SendAnnouncementAPIView.as_view(), name='send-announcement'),
    path('announcements/sent/', SentAnnouncementsListAPIView.as_view(), name='sent-announcements'),
    path('announcements/<int:id>/', AnnouncementDetailAPIView.as_view(), name='announcement-detail'),
    path('announcements/course/<int:course_id>/', CourseAnnouncementsListAPIView.as_view(), name='course-announcements'),
    path('announcements/my/', MyAnnouncementsListAPIView.as_view(), name='my-announcements'),
    path('announcements/<int:announcement_id>/mark-read/', mark_announcement_read, name='mark-read'),
]

