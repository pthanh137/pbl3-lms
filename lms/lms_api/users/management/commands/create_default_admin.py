from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates default admin user (admin@test.com / admin123) if it does not exist'

    def handle(self, *args, **options):
        email = 'admin@test.com'
        password = 'admin123'
        
        # Check if admin already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {email} already exists. Skipping creation.')
            )
            return
        
        # Create admin user
        admin = User.objects.create_user(
            email=email,
            password=password,
            role='admin',
            full_name='System Administrator',
            is_staff=True,
            is_superuser=True,
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created admin user: {email}')
        )

