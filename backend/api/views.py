from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Profile, SessionHistory
from .serializers import UserSerializer, RegisterSerializer, SessionHistorySerializer

class RegisterAPI(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            user_serializer = UserSerializer(user)
            return Response({
                'token': token.key,
                'user': user_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPI(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            user_serializer = UserSerializer(user)
            return Response({
                'token': token.key,
                'user': user_serializer.data
            })
        return Response({'non_field_errors': ['Invalid credentials']}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileAPI(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile = request.user.profile
        active_sound = request.data.get('active_sound')
        active_theme = request.data.get('active_theme')
        
        if active_sound is not None:
            profile.active_sound = active_sound
        if active_theme is not None:
            profile.active_theme = active_theme
            
        profile.save()
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class SessionHistoryAPI(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = SessionHistory.objects.filter(user=request.user).order_by('-timestamp')[:50]
        serializer = SessionHistorySerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        serializer = SessionHistorySerializer(data=data)
        if serializer.is_valid():
            session = serializer.save(user=request.user)
            
            # Update user profile stats
            profile = request.user.profile
            profile.coins += session.coins_earned
            profile.xp += session.xp_earned
            
            # Running formula to recalculate WPM and Accuracy
            if session.wpm > 0:
                profile.avg_wpm = round((profile.avg_wpm * 2 + session.wpm) / 3)
            if session.accuracy > 0:
                profile.avg_accuracy = round((profile.avg_accuracy * 2 + session.accuracy) / 3)
                
            # Merge key metrics
            new_metrics = data.get('key_metrics', {})
            if isinstance(new_metrics, dict):
                merged = profile.key_metrics or {}
                for key, stats in new_metrics.items():
                    if not isinstance(stats, dict):
                        continue
                    if key not in merged:
                        merged[key] = {'total': 0, 'errors': 0, 'latencies': []}
                    merged[key]['total'] += stats.get('total', 0)
                    merged[key]['errors'] += stats.get('errors', 0)
                    latencies = stats.get('latencies', [])
                    if isinstance(latencies, list):
                        merged[key]['latencies'] = (merged[key]['latencies'] + latencies)[-15:]
                profile.key_metrics = merged
                
            profile.save()
            return Response({
                'session': serializer.data,
                'coins': profile.coins,
                'xp': profile.xp,
                'avg_wpm': profile.avg_wpm,
                'avg_accuracy': profile.avg_accuracy,
                'key_metrics': profile.key_metrics
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StorePurchaseAPI(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        item_id = request.data.get('item_id')
        price = request.data.get('price')
        
        if not item_id or price is None:
            return Response({'error': 'Item ID and price are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            price = int(price)
        except ValueError:
            return Response({'error': 'Price must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
            
        if profile.coins < price:
            return Response({'error': 'Insufficient coins'}, status=status.HTTP_400_BAD_REQUEST)
            
        if item_id in profile.purchased_items:
            return Response({'error': 'Item already purchased'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Deduct coins and add to purchased items
        profile.coins -= price
        profile.purchased_items.append(item_id)
        profile.save()
        
        return Response({
            'coins': profile.coins,
            'purchased_items': profile.purchased_items
        })

class LeaderboardAPI(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Fetch top users by XP
        profiles = Profile.objects.select_related('user').order_by('-xp')[:20]
        leaderboard_data = []
        for rank, p in enumerate(profiles, start=1):
            leaderboard_data.append({
                'rank': rank,
                'username': p.user.username,
                'xp': p.xp,
                'avg_wpm': p.avg_wpm,
                'avg_accuracy': p.avg_accuracy,
                'level': (p.xp // 500) + 1
            })
        return Response(leaderboard_data)
