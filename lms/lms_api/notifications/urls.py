from django.urls import path
from .views import (
    NotificationListAPIView,
    mark_notification_read,
    mark_all_notifications_read,
    get_unread_count,
)

app_name = 'notifications'

urlpatterns = [
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/read/', mark_notification_read, name='mark-read'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='mark-all-read'),
    path('notifications/unread-count/', get_unread_count, name='unread-count'),
]

