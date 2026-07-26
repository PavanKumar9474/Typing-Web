from django.urls import path
from .views import RegisterAPI, LoginAPI, UserProfileAPI, SessionHistoryAPI, StorePurchaseAPI, LeaderboardAPI

urlpatterns = [
    path('register/', RegisterAPI.as_view(), name='register'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('profile/', UserProfileAPI.as_view(), name='profile'),
    path('session/', SessionHistoryAPI.as_view(), name='session'),
    path('purchase/', StorePurchaseAPI.as_view(), name='purchase'),
    path('leaderboard/', LeaderboardAPI.as_view(), name='leaderboard'),
]
