from django.db import models

class Host(models.Model):
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=15, unique=True)

    def __str__(self):
        return self.name

class User(models.Model):
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=15, unique=True)
    # role = models.CharField(max_length=100)
    skills = models.TextField()
    age = models.IntegerField()
    location = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    # points = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class EventInfo(models.Model):
    event_name = models.CharField(max_length=255)
    overview = models.TextField()
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    host = models.ForeignKey(Host, on_delete=models.CASCADE)
    volunteer_enrolled = models.ManyToManyField(User, related_name='enrolled_events')
    required_volunteers = models.IntegerField()
    # points_for_volunteers = models.IntegerField()
    status = models.CharField(max_length=50)
    volunteer_efficiency = models.FloatField()
    task_analysis = models.TextField()

    def __str__(self):
        return self.event_name

class TaskInfo(models.Model):
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE)
    task_name = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=50)
    volunteereffieciency = models.IntegerField()
    taskanalysis = models.TextField()

    def __str__(self):
        return self.event.event_name + "-" + self.task_name

class Feedback(models.Model):
    event = models.ForeignKey(EventInfo, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()

    def __str__(self):
        return f"Feedback by {self.user.name} for {self.event.event_name}"

class Chat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(TaskInfo, on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return f"Chat by {self.user.name} on {self.task.task_name}"