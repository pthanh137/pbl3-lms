from django.contrib import admin
from .models import Course, Section, Lesson


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    ordering = ['sort_order']


class SectionInline(admin.TabularInline):
    model = Section
    extra = 1
    ordering = ['sort_order']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'level', 'price', 'is_published', 'created_at']
    list_filter = ['level', 'is_published', 'category', 'created_at']
    search_fields = ['title', 'subtitle', 'description']
    inlines = [SectionInline]


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'sort_order']
    list_filter = ['course']
    search_fields = ['title']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'section', 'duration', 'sort_order']
    list_filter = ['section__course']
    search_fields = ['title']

