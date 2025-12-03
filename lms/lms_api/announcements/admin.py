from django.contrib import admin
from .models import Announcement, AnnouncementReadStatus


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'teacher', 'created_at']
    list_filter = ['created_at', 'course']
    search_fields = ['title', 'message', 'course__title', 'teacher__email']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(AnnouncementReadStatus)
class AnnouncementReadStatusAdmin(admin.ModelAdmin):
    list_display = ['announcement', 'student', 'is_read', 'read_at']
    list_filter = ['is_read', 'read_at']
    search_fields = ['announcement__title', 'student__email']
    readonly_fields = ['read_at']
