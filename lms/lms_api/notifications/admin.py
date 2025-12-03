from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'course', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at', 'course']
    search_fields = ['title', 'message', 'user__email', 'course__title']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_editable = ['is_read']
