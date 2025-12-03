from django.contrib import admin
from .models import Enrollment, LessonProgress, Certificate, CartItem


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'progress_percent', 'created_at']
    list_filter = ['created_at', 'course']
    search_fields = ['student__email', 'course__title']
    readonly_fields = ['created_at']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'lesson', 'is_completed']
    list_filter = ['is_completed', 'enrollment__course']
    search_fields = ['enrollment__student__email', 'lesson__title']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'certificate_code', 'issued_at']
    list_filter = ['issued_at']
    search_fields = ['user__email', 'course__title', 'certificate_code']
    readonly_fields = ['certificate_code', 'issued_at']


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'price_at_add', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'course__title']
    readonly_fields = ['created_at']

