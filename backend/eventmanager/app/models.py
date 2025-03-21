from django.db import models
from django.utils import timezone

class Host(models.Model):
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class User(models.Model):
    
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=15, unique=True)
    skills = models.TextField(blank=True)
    age = models.IntegerField()
    location = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    host = models.ForeignKey(Host, on_delete=models.CASCADE, related_name='hosted_events')
    volunteer_enrolled = models.ManyToManyField(User, related_name='enrolled_events', blank=True)
    required_volunteers = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')
    volunteer_efficiency = models.FloatField(default=0.0)
    task_analysis = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image=models.ImageField(upload_to='images/', blank=True , null=True)

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

class TaskInfo(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE, related_name='tasks')
    task_name = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    volunteer_efficiency = models.IntegerField(default=0)
    task_analysis = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.event.event_name} - {self.task_name}"

class Feedback(models.Model):
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_feedbacks')
    content = models.TextField()
    rating = models.IntegerField(default=0, choices=[(i, i) for i in range(1, 6)])  # 1-5 rating scale
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback by {self.user.name} for {self.event.event_name}"

class Chat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    task = models.ForeignKey(TaskInfo, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Chat by {self.user.name} on {self.task.task_name}"