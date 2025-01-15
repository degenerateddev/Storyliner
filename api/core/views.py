from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Character, JSON
from .serializers import CharacterSerializer, JSONSerializer
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import logging

class JSONViewSet(viewsets.ModelViewSet):
    serializer_class = JSONSerializer
    permission_classes = [IsAuthenticated]
    queryset = JSON.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        logging.debug(f"Incoming data: {request.data}")
        try:
            instance = JSON.objects.get(user=request.user)
            serializer = self.get_serializer(instance, data=request.data)
        except JSON.DoesNotExist:
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logging.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CharacterViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
    queryset = Character.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logging.debug(f"Request data: {request.data}")
        
        try:
            id = request.POST.get("id")
            instance = Character.objects.get(_id=id, user=request.user)
            serializer = self.get_serializer(instance, data=request.data)
        except Character.DoesNotExist:
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            print(kwargs)
            instance = self.queryset.get(_id=kwargs['pk'], user=request.user)
            self.perform_destroy(instance)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
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