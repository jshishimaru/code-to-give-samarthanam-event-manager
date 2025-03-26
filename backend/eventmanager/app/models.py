from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator

# Custom User Manager that uses email instead of username
class CustomUserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def _create_user(self, email, password=None, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)

class User(AbstractUser):
    # Remove the username field
    username = None
    
    # Add email as the unique identifier
    email = models.EmailField(_('email address'), unique=True)
    
    # Common fields for all users
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=15, unique=True)
    
    # Field to distinguish between host and regular user
    isHost = models.BooleanField(default=False)
    
    # Additional fields for regular users (blank and null for hosts)
    skills = models.TextField(blank=True)
    age = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    
    # Override fields from AbstractUser
    first_name = None  # We'll use 'name' instead
    last_name = None  # We'll use 'name' instead
    
    # Specify email as the USERNAME_FIELD
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'contact']  # Required fields for createsuperuser
    
    # Specify the custom manager
    objects = CustomUserManager()

    def __str__(self):
        return self.name

class EventInfo(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Upcoming', 'Upcoming'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    event_name = models.CharField(max_length=255)
    overview = models.TextField()
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Update host to reference the new User model with isHost=True
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_events', 
                             limit_choices_to={'isHost': True})
    
    # Update volunteer_enrolled to reference the new User model with isHost=False
    volunteer_enrolled = models.ManyToManyField(User, related_name='enrolled_events', blank=True,
                                              limit_choices_to={'isHost': False})
    
    required_volunteers = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')
    volunteer_efficiency = models.FloatField(default=0.0)
    task_analysis = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='images/', blank=True, null=True)

    def __str__(self):
        return self.event_name
    
    def save(self, *args, **kwargs):
        # Auto update status based on dates
        now = timezone.now()
        if self.status != 'Cancelled' and self.status != 'Draft':
            if self.end_time < now:
                self.status = 'Completed'
            elif self.start_time < now < self.end_time:
                self.status = 'In Progress'
            elif now < self.start_time:
                self.status = 'Upcoming'
        super().save(*args, **kwargs)
# Update TaskInfo and SubTask models

class TaskInfo(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    # Many-to-many relationship with volunteers
    volunteers = models.ManyToManyField(User, related_name='assigned_tasks', 
                                     limit_choices_to={'isHost': False}, blank=True)
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE, related_name='tasks')
    task_name = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    
    # New skills field
    required_skills = models.TextField(blank=True, help_text="Comma-separated list of skills required for this task")
    
    # Notification field (for volunteers to notify host)
    completion_notified = models.BooleanField(default=False, 
                                           help_text="Indicates if volunteers have notified that the task is completed")
    notification_message = models.TextField(blank=True, 
                                         help_text="Message from volunteers about task completion")
    notification_time = models.DateTimeField(null=True, blank=True)
    
    volunteer_efficiency = models.IntegerField(default=0)
    task_analysis = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def all_subtasks_complete(self):
        """Check if all subtasks are completed"""
        total_subtasks = self.subtasks.count()
        if total_subtasks == 0:
            return False
        completed_subtasks = self.subtasks.filter(status='Completed').count()
        return total_subtasks == completed_subtasks
    
    def update_status(self):
        """Update task status based on subtask completion"""
        if not self.subtasks.exists():
            return
            
        all_complete = self.all_subtasks_complete
        any_in_progress = self.subtasks.filter(status='In Progress').exists()
        
        if all_complete:
            self.status = 'Completed'
        elif any_in_progress:
            self.status = 'In Progress'
        else:
            self.status = 'Pending'
        
        self.save()
            
    def get_skills_list(self):
        """Return the skills as a list"""
        if not self.required_skills:
            return []
        return [skill.strip() for skill in self.required_skills.split(',')]


class SubTask(models.Model):
    """A simpler model for subtasks linked to a main task"""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]
    
    # Link to the parent task
    parent_task = models.ForeignKey(TaskInfo, on_delete=models.CASCADE, related_name='subtasks')
    
    # Basic fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    
    # Add priority field
    priority = models.IntegerField(default=0, help_text="Priority level of the subtask (higher number = higher priority)")
    
    # Add completion percentage
    completion_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of subtask completion"
    )
    
    # Notification fields
    completion_notified = models.BooleanField(
        default=False, 
        help_text="Indicates if volunteers have notified that the subtask is completed"
    )
    notification_message = models.TextField(
        blank=True, 
        help_text="Message from volunteers about subtask completion"
    )
    notification_time = models.DateTimeField(null=True, blank=True)
    
    # Dependencies
    dependencies = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='dependent_tasks',
        blank=True,
        help_text="Subtasks that must be completed before this one can start"
    )
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        try:
            parent_task_name = self.parent_task.task_name if self.parent_task_id else "Unknown Task"
            return f"{parent_task_name} - {self.title}"
        except (TaskInfo.DoesNotExist, AttributeError):
            return f"SubTask: {self.title or 'New SubTask'}"
    
    @property
    def is_blocked(self):
        """Check if this subtask is blocked by incomplete dependencies"""
        return self.dependencies.exclude(status='Completed').exists()
    
    @property
    def can_start(self):
        """Check if this subtask can be started"""
        return not self.is_blocked and self.status == 'Pending'
    
    @property
    def is_overdue(self):
        """Check if subtask is overdue"""
        return self.end_time < timezone.now() and self.status != 'Completed'
    
    def complete(self):
        """Mark the subtask as complete"""
        self.status = 'Completed'
        self.completed_at = timezone.now()
        self.completion_percentage = 100
        self.save()
        
        # Check if parent task should be marked complete
        if self.parent_task.all_subtasks_complete:
            self.parent_task.status = 'Completed'
            self.parent_task.save()
    
    def save(self, *args, **kwargs):
        # Auto-update status based on completion percentage
        if self.completion_percentage == 100 and self.status != 'Completed':
            self.status = 'Completed'
            self.completed_at = timezone.now()
        elif self.completion_percentage > 0 and self.status == 'Pending':
            self.status = 'In Progress'
        
        super().save(*args, **kwargs)
        
        # Update parent task status
        if self.parent_task_id:
            try:
                self.parent_task.update_status()
            except TaskInfo.DoesNotExist:
                pass
    
    class Meta:
        ordering = ['-priority', 'start_time']
        constraints = [
            models.CheckConstraint(
                check=models.Q(completion_percentage__gte=0) & models.Q(completion_percentage__lte=100),
                name='valid_completion_percentage'
            )
        ]
        
class Feedback(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 11)]  # 1-10 rating scale
    
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_feedbacks',
                           limit_choices_to={'isHost': False})
    
    # Detailed ratings - made nullable or with defaults
    overall_experience = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    organization_quality = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    communication = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    host_interaction = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    volunteer_support = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    task_clarity = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    impact_awareness = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    inclusivity = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    time_management = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    recognition = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, default=5)
    
    # Additional feedback
    strengths = models.TextField(blank=True, help_text="What aspects of the event worked particularly well?")
    improvements = models.TextField(blank=True, help_text="What aspects could be improved for future events?")
    additional_comments = models.TextField(blank=True, help_text="Any other comments or suggestions")
    
    would_volunteer_again = models.BooleanField(default=True, help_text="Would you volunteer for a similar event in the future?")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback by {self.user.name} for {self.event.event_name}"
    
    @property
    def average_rating(self):
        """Calculate the average rating across all numeric feedback fields"""
        ratings = []
        
        # Only include fields that have values
        for field in [
            self.overall_experience,
            self.organization_quality,
            self.communication,
            self.host_interaction,
            self.volunteer_support,
            self.task_clarity,
            self.impact_awareness,
            self.inclusivity,
            self.time_management,
            self.recognition
        ]:
            if field is not None:
                ratings.append(field)
        
        if not ratings:
            return 0
            
        return sum(ratings) / len(ratings)
    
    class Meta:
        # Ensure a volunteer can only submit one feedback per event
        unique_together = ['event', 'user']

class Chat(models.Model):
    """Task-specific chat messages between volunteers and hosts"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    task = models.ForeignKey(TaskInfo, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    is_host = models.BooleanField(default=False, help_text="Indicates if the message was sent by a host")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        try:
            user_name = self.user.name if self.user_id else "Unknown User"
            task_name = self.task.task_name if self.task_id else "Unknown Task"
            return f"Chat by {user_name} on {task_name}"
        except (User.DoesNotExist, TaskInfo.DoesNotExist, AttributeError):
            return f"Chat ID: {self.id or 'New'}"
    
    def save(self, *args, **kwargs):
        # Auto-set is_host based on the user's status
        if self.user_id:  # Only try to access user if we have a user_id
            try:
                self.is_host = self.user.isHost
            except User.DoesNotExist:
                pass  # Keep the default value if user doesn't exist
        super().save(*args, **kwargs)
    
class EventChat(models.Model):
    """Community chat messages for events"""
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE, related_name='chat_messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_messages')
    message = models.TextField()
    is_host = models.BooleanField(default=False, help_text="Indicates if the message was sent by a host")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message by {self.user.name} in {self.event.event_name}"
    
    def save(self, *args, **kwargs):
        # Auto-set is_host based on the user's status
        self.is_host = self.user.isHost
        super().save(*args, **kwargs)