from django.db import models

class Event(models.Model):
    event_name = models.CharField(max_length=200)
    user_name = models.CharField(max_length=100)  # Username associated with the event
    password = models.CharField(max_length=100)  # Password for user authentication (if used for custom auth)
    event_amount = models.CharField(max_length=10, default='0')
    
    def __str__(self):
        return self.event_name  # Or whatever field you use to represent the event

class Finance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='finances')
    from_person = models.CharField(max_length=100)
    to_person = models.CharField(max_length=100)
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date_event = models.DateField()
    mode = models.CharField(max_length=50)

    def __str__(self):
        return f"Finance for {self.event.event_name} - {self.amount}"
