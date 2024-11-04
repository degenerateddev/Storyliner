from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class Dialogue(APIView):
    def get(self, request):
        return Response({"message": "Dialogue GET request"})

    def post(self, request):
        return Response({"message": "Dialogue POST request"})