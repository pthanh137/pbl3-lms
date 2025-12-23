from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def create_default_admin_user(sender, **kwargs):
    """Create default admin user after migrations."""
    # Only run for users app
    if sender.name != 'users':
        return
    
    # Only run if this is the first migration (to avoid creating on every migrate)
    # Check if User table exists and has any users
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Only create if no admin user exists yet
    if User.objects.filter(role='admin').exists():
        return
    
    email = 'admin@test.com'
    password = 'admin123'
    
    # Only create if it doesn't exist
    if not User.objects.filter(email=email).exists():
        try:
            User.objects.create_user(
                email=email,
                password=password,
                role='admin',
                full_name='System Administrator',
                is_staff=True,
                is_superuser=True,
            )
        except Exception:
            # Silently fail if there's any issue
            pass


