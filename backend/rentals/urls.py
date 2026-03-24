from django.urls import path
from . import views

urlpatterns = [
    path('vehicles/',                views.vehicle_list,       name='vehicle-list'),
    path('vehicles/<int:pk>/',       views.vehicle_detail,     name='vehicle-detail'),
    path('rentals/',                 views.rental_list_create, name='rental-list-create'),
    path('rentals/<int:pk>/return/', views.rental_return,      name='rental-return'),
]