"""
Notification Views

API endpoints for notification system.
"""

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.db.models import Q

from .models import Notification
from .serializers import NotificationSerializer, NotificationListSerializer


class NotificationListAPIView(generics.ListAPIView):
    """
    GET /api/notifications/
    
    Return list of notifications for logged-in user.
    Unread first, then newest.
    """
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get notifications for current user, unread first, then newest."""
        user = self.request.user
        
        return Notification.objects.filter(
            user=user
        ).select_related('course').order_by('is_read', '-created_at')


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    PATCH /api/notifications/<id>/read/
    
    Mark a notification as read.
    """
    try:
        notification = Notification.objects.get(
            id=notification_id,
            user=request.user
        )
    except Notification.DoesNotExist:
        return Response(
            {"detail": "Notification not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not notification.is_read:
        notification.mark_as_read()
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read(request):
    """
    PATCH /api/notifications/mark-all-read/
    
    Mark all notifications as read for the current user.
    """
    updated_count = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).update(is_read=True)
    
    return Response({
        "detail": f"Marked {updated_count} notifications as read.",
        "updated_count": updated_count
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_count(request):
    """
    GET /api/notifications/unread-count/
    
    Get count of unread notifications for the current user.
    """
    count = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).count()
    
    return Response({
        "unread_count": count
    }, status=status.HTTP_200_OK)
