from django.core.management.base import BaseCommand
from app.models import User
from django.contrib.auth.hashers import make_password, check_password, is_password_usable
import getpass

class Command(BaseCommand):
    help = 'Fix plain text passwords by properly hashing them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the specific user to fix',
        )
        
        parser.add_argument(
            '--check-all',
            action='store_true',
            help='Check all users for potentially unhashed passwords',
        )

    def handle(self, *args, **options):
        email = options['email']
        check_all = options['check_all']
        
        if email:
            # Fix a specific user
            try:
                user = User.objects.get(email=email)
                self._fix_user_password(user)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User with email {email} not found'))
        elif check_all:
            # Check all users
            self._check_all_users()
        else:
            self.stdout.write(self.style.WARNING('Please specify --email to fix a specific user or --check-all to check all users'))
    
    def _check_all_users(self):
        """Check all users for potentially unhashed passwords"""
        all_users = User.objects.all()
        potentially_unhashed = []
        
        for user in all_users:
            # Check if the password looks hashed
            if not user.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
                potentially_unhashed.append(user)
        
        if not potentially_unhashed:
            self.stdout.write(self.style.SUCCESS('All users appear to have properly hashed passwords!'))
            return
        
        self.stdout.write(self.style.WARNING(f'Found {len(potentially_unhashed)} users with potentially unhashed passwords:'))
        
        for i, user in enumerate(potentially_unhashed, 1):
            self.stdout.write(f"{i}. {user.email} - {user.name}")
        
        fix_all = input("\nDo you want to fix all these accounts? (yes/no): ").lower() == 'yes'
        
        if fix_all:
            for user in potentially_unhashed:
                self._fix_user_password(user)
        else:
            self.stdout.write(self.style.WARNING('No accounts were fixed. You can fix individual accounts with:'))
            self.stdout.write('python manage.py fix_password_hashing --email user@example.com')
    
    def _fix_user_password(self, user):
        """Fix a single user's password"""
        self.stdout.write(f'Fixing password for user: {user.email} - {user.name}')
        
        # Check if we need to fix this password
        if is_password_usable(user.password) and user.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.stdout.write(self.style.SUCCESS(f'Password for {user.email} is already properly hashed'))
            return
        
        # Store the current password value (likely plain text)
        current_password = user.password
        
        # Options for the user
        self.stdout.write('\nOptions:')
        self.stdout.write('1. Enter the plain text password (if you know it)')
        self.stdout.write('2. Set a new password')
        choice = input('Enter choice (1 or 2): ')
        
        if choice == '1':
            # User knows the plain text password
            plain_text = getpass.getpass('Enter the current plain text password: ')
            # Set the password with proper hashing
            user.set_password(plain_text)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Password for {user.email} has been properly hashed'))
        elif choice == '2':
            # Set a new password
            new_password = getpass.getpass('Enter new password: ')
            confirm_password = getpass.getpass('Confirm password: ')
            
            if new_password != confirm_password:
                self.stdout.write(self.style.ERROR('Passwords do not match. No changes made.'))
                return
            
            user.set_password(new_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'New password set for {user.email}'))
        else:
            self.stdout.write(self.style.ERROR('Invalid choice. No changes made.'))
            return