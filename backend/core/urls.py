from django.urls import path
from . import views

urlpatterns = [
    path('locations/', views.get_locations, name='get_locations'),
    path('locations/<int:pk>/', views.get_location, name='get_location'),
    path('cities/', views.get_cities, name='get_cities'),
]