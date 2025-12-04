from django.urls import path
from .views import (
    SendMessageAPIView,
    get_conversation,
    get_unread_messages,
    mark_message_read,
    get_conversations_list,
    get_available_contacts,
    typing_indicator,
    get_typing_indicator,
    get_my_groups,
    get_group_messages,
    send_group_message,
    UserCourseGroups,
    GroupMembersAPIView,
    get_unread_count,
)

urlpatterns = [
    path('messages/send/', SendMessageAPIView.as_view(), name='message-send'),
    path('messages/conversation/', get_conversation, name='message-conversation'),
    path('messages/unread/', get_unread_messages, name='message-unread'),
    path('messages/unread-count/', get_unread_count, name='message-unread-count'),
    path('messages/<int:message_id>/read/', mark_message_read, name='message-mark-read'),
    path('messages/conversations/', get_conversations_list, name='message-conversations'),
    path('messages/contacts/', get_available_contacts, name='message-contacts'),
    path('messages/typing/', typing_indicator, name='message-typing'),
    path('messages/typing/status/', get_typing_indicator, name='message-typing-status'),
    # Group chat endpoints
    path('messages/groups/', UserCourseGroups.as_view(), name='user-course-groups'),
    path('messages/groups/my/', get_my_groups, name='groups-my'),
    path('messages/groups/<int:group_id>/members/', GroupMembersAPIView.as_view(), name='group-members'),
    path('messages/groups/<int:group_id>/messages/', get_group_messages, name='group-messages'),
    path('messages/groups/<int:group_id>/messages/send/', send_group_message, name='group-message-send'),
]

