from django.contrib import admin
from .models import Message, TypingIndicator


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'receiver', 'course', 'sent_at', 'is_read']
    list_filter = ['is_read', 'sent_at', 'course']
    search_fields = ['sender__email', 'receiver__email', 'content']
    readonly_fields = ['sent_at']
    date_hierarchy = 'sent_at'


@admin.register(TypingIndicator)
class TypingIndicatorAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'receiver', 'is_typing', 'updated_at']
    list_filter = ['is_typing', 'updated_at']
    search_fields = ['sender__email', 'receiver__email']
    readonly_fields = ['updated_at']
