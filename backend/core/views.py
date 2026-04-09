from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Location
from .models import City

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_locations(request):
    locations = Location.objects.all()
    data = [
        {
            'id': loc.id,
            'address': loc.address,
            'x': loc.x,
            'y': loc.y,
        }
        for loc in locations
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_location(request, pk):
    try:
        loc = Location.objects.get(id=pk)
    except Location.DoesNotExist:
        return Response({'error': 'Location not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'id': loc.id, 'address': loc.address, 'x': loc.x, 'y': loc.y})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cities(request):
    cities = City.objects.all()
    data = [
        {
            'id': city.id,
            'name': city.name,
            'min_lat': min(city.top_left_x, city.bottom_left_x),
            'max_lat': max(city.top_left_x, city.bottom_left_x),
            'min_lng': min(city.top_left_y, city.top_right_y),
            'max_lng': max(city.top_left_y, city.top_right_y),
        }
        for city in cities
    ]
    return Response(data)