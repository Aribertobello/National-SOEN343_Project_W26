from django.urls import path
from . import views

urlpatterns = [
    path('vehicles/',                views.vehicle_list,       name='vehicle-list'),
    path('vehicles/<int:pk>/',       views.vehicle_detail,     name='vehicle-detail'),
    path('rentals/',                 views.rental_list_create, name='rental-list-create'),
    path('rentals/<int:pk>/return/', views.rental_return,      name='rental-return'),
    path('op/stations/',             views.operator_stations, name='operator_stations'),
    path('op/vehicles/',             views.operator_vehicles, name='operator_vehicles'),
    path('op/rentals/', views.operator_rentals, name='operator_rentals'),
]