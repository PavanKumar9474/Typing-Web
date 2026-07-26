from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, SessionHistory

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['coins', 'xp', 'avg_wpm', 'avg_accuracy', 'purchased_items', 'active_sound', 'active_theme', 'key_metrics']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        email = validated_data.get('email', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=email
        )
        # Create user profile
        Profile.objects.create(user=user)
        return user

class SessionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionHistory
        fields = ['id', 'game_type', 'wpm', 'accuracy', 'score', 'coins_earned', 'xp_earned', 'timestamp']
        read_only_fields = ['id', 'timestamp']
