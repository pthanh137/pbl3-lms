from rest_framework import permissions


class IsMessageParticipant(permissions.BasePermission):
    """
    Permission to only allow sender or receiver to view/edit a message.
    """
    
    def has_object_permission(self, request, view, obj):
        # Only sender or receiver can access the message
        return (
            request.user and
            request.user.is_authenticated and
            (obj.sender == request.user or obj.receiver == request.user)
        )

