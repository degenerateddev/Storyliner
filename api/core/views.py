from django.contrib.auth.models import User
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Character, Project
from .serializers import CharacterSerializer, ProjectListSerializer, ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """The stories of a user. The list leaves out the graphs; updates replace the story JSON."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        projects = Project.objects.filter(user=self.request.user)
        if self.action == "list":
            projects = projects.annotate(character_count=Count("characters"))
        return projects

    def get_serializer_class(self):
        return ProjectListSerializer if self.action == "list" else ProjectSerializer


class CharacterViewSet(viewsets.ModelViewSet):
    """Characters of one project (`projects/<project_id>/characters/`)."""

    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "_id"

    def get_project(self):
        return get_object_or_404(Project, pk=self.kwargs["project_id"], user=self.request.user)

    def get_queryset(self):
        return Character.objects.filter(project=self.get_project())

    def create(self, request, *args, **kwargs):
        """Upsert by the client-side `_id`."""
        project = self.get_project()
        instance = Character.objects.filter(project=project, _id=request.data.get("_id")).first()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
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
