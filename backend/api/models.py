from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    coins = models.IntegerField(default=120)
    xp = models.IntegerField(default=150)
    avg_wpm = models.IntegerField(default=65)
    avg_accuracy = models.IntegerField(default=97)
    purchased_items = models.JSONField(default=list, blank=True)
    active_sound = models.CharField(max_length=50, default='mechanical')
    active_theme = models.CharField(max_length=50, default='cyberpunk')
    key_metrics = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class SessionHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    game_type = models.CharField(max_length=100)
    wpm = models.IntegerField()
    accuracy = models.IntegerField()
    score = models.IntegerField()
    coins_earned = models.IntegerField()
    xp_earned = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.game_type} - {self.wpm} WPM ({self.timestamp})"
