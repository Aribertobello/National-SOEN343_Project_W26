from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.utils import timezone
from rentals.models import Rental
from analytics.models import Trip
from rest_framework import status
from rest_framework.response import Response
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

# Create your views here.

User = get_user_model()
 
 
class AdminOverviewView(APIView):
    def get(self, request):

        # Currently not in fuction as no admin account
        """ 
        # --- Auth check ---
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN
            )
        """

        
        now = timezone.now()


        customers = User.objects.filter(role=User.Role.CUSTOMER).order_by("-id")[:50]
        operators = User.objects.filter(role=User.Role.OPERATOR).order_by("-id")[:50]
        active_rentals_qs = Rental.objects.filter(
            end_date_time__gte=now,
        ).order_by("-start_date_time")[:50]
        trips = Trip.objects.all().order_by("-start_time")[:50]


        total_customers = customers.count()
        total_operators = operators.count()
        active_rentals = active_rentals_qs.count()
        completed_trips = trips.count()


        customers_data = list(customers.values("id", "email", "name"))
        operators_data = list(operators.values("id", "email", "name"))
        rentals_data = list(active_rentals_qs.values("vehicle", "user", "start_date_time", "end_date_time"))
        trips_data = list(trips.values("vehicle", "user", "start_time", "end_time"))


        return Response({
            "total_customers": total_customers,
            "total_operators": total_operators,
            "active_rentals": active_rentals,
            "completed_trips": completed_trips,

            "customers": customers_data,
            "operators": operators_data,
            "active_rentals_list": rentals_data,
            "completed_trips_list": trips_data,
        })
