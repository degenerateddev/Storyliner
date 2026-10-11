from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Character, JSON
from .serializers import CharacterSerializer, JSONSerializer


class JSONViewSet(viewsets.GenericViewSet):
    """Each user owns exactly one story: GET returns it, POST creates or replaces it."""

    serializer_class = JSONSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JSON.objects.filter(user=self.request.user)

    def list(self, request):
        instance = self.get_queryset().first()
        return Response({"json": instance.json if instance else None})

    def create(self, request):
        instance = self.get_queryset().first()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED)


class CharacterViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "_id"
    lookup_value_regex = "[^/]+"

    def get_queryset(self):
        return Character.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Upsert by the client-side `_id`."""
        instance = self.get_queryset().filter(_id=request.data.get("_id")).first()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")

        if not username or not password or not email:
            return Response({"error": "Please provide all required fields"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        refresh = RefreshToken.for_user(user)

        return Response(
            {"refresh": str(refresh), "access": str(refresh.access_token)},
            status=status.HTTP_201_CREATED,
        )
