# Migration to add start_time and end_time columns to student_quiz_attempts table
# This migration uses raw SQL to ensure MySQL has the columns even if Django migration failed

from django.db import migrations


def add_columns_if_not_exists(apps, schema_editor):
    """Add start_time and end_time columns if they don't exist."""
    db_alias = schema_editor.connection.alias
    
    # Use raw SQL to check and add columns
    with schema_editor.connection.cursor() as cursor:
        # Check if start_time exists
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'student_quiz_attempts'
            AND COLUMN_NAME = 'start_time'
        """)
        start_time_exists = cursor.fetchone()[0] > 0
        
        # Check if end_time exists
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'student_quiz_attempts'
            AND COLUMN_NAME = 'end_time'
        """)
        end_time_exists = cursor.fetchone()[0] > 0
        
        # Add start_time if it doesn't exist
        if not start_time_exists:
            cursor.execute("""
                ALTER TABLE student_quiz_attempts 
                ADD COLUMN start_time DATETIME NULL
            """)
            print("Added start_time column to student_quiz_attempts")
        
        # Add end_time if it doesn't exist
        if not end_time_exists:
            cursor.execute("""
                ALTER TABLE student_quiz_attempts 
                ADD COLUMN end_time DATETIME NULL
            """)
            print("Added end_time column to student_quiz_attempts")


def remove_columns(apps, schema_editor):
    """Remove start_time and end_time columns (reverse migration)."""
    db_alias = schema_editor.connection.alias
    
    with schema_editor.connection.cursor() as cursor:
        # Check if columns exist before dropping
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'student_quiz_attempts'
            AND COLUMN_NAME = 'start_time'
        """)
        if cursor.fetchone()[0] > 0:
            cursor.execute("ALTER TABLE student_quiz_attempts DROP COLUMN start_time")
        
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'student_quiz_attempts'
            AND COLUMN_NAME = 'end_time'
        """)
        if cursor.fetchone()[0] > 0:
            cursor.execute("ALTER TABLE student_quiz_attempts DROP COLUMN end_time")


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0003_fix_old_quiz_attempts_times'),
    ]

    operations = [
        migrations.RunPython(add_columns_if_not_exists, remove_columns),
    ]

