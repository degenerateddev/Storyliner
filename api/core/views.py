from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Character, Dialogue
from .serializers import CharacterSerializer, DialogueSerializer
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

class DialogueViewSet(viewsets.ModelViewSet):
    serializer_class = DialogueSerializer
    permission_classes = [IsAuthenticated]
    queryset = Dialogue.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class CharacterViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
    queryset = Character.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
    
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password or not email:
            return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)