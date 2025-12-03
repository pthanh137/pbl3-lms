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
)

urlpatterns = [
    path('messages/send/', SendMessageAPIView.as_view(), name='message-send'),
    path('messages/conversation/', get_conversation, name='message-conversation'),
    path('messages/unread/', get_unread_messages, name='message-unread'),
    path('messages/mark-read/<int:message_id>/', mark_message_read, name='message-mark-read'),
    path('messages/conversations/', get_conversations_list, name='message-conversations'),
    path('messages/contacts/', get_available_contacts, name='message-contacts'),
    path('messages/typing/', typing_indicator, name='message-typing'),
    path('messages/typing/status/', get_typing_indicator, name='message-typing-status'),
]

