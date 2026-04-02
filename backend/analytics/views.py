from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.utils import timezone
from rentals.models import Rental
from analytics.models import Trip
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta

User = get_user_model()
 
 
ALLOWED_USER_LIMITS = {10, 25, 50, 100}
DEFAULT_USER_LIMIT  = 50
 
TIME_RANGE_DELTAS = {
    "week":  timedelta(weeks=1),
    "month": timedelta(days=30),
}
 
 
class AdminOverviewView(APIView):
    def get(self, request):

        """
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
        try:
            user_limit = int(request.query_params.get("user_limit", DEFAULT_USER_LIMIT))
            if user_limit not in ALLOWED_USER_LIMITS:
                user_limit = DEFAULT_USER_LIMIT
        except (ValueError, TypeError):
            user_limit = DEFAULT_USER_LIMIT
 
        time_range = request.query_params.get("time_range", "all")
        if time_range not in ("week", "month", "all"):
            time_range = "all"
 
 
        if time_range in TIME_RANGE_DELTAS:
            since = now - TIME_RANGE_DELTAS[time_range]
        else:
            since = None
 
 
        customers = (
            User.objects.filter(role=User.Role.CUSTOMER)
            .order_by("-id")[:user_limit]
        )
        operators = (
            User.objects.filter(role=User.Role.OPERATOR)
            .order_by("-id")[:user_limit]
        )
 
 
        active_rentals_qs = Rental.objects.filter(end_date_time__gte=now)
        if since is not None:
            active_rentals_qs = active_rentals_qs.filter(start_date_time__gte=since)
        active_rentals_qs = active_rentals_qs.order_by("-start_date_time")
 
        trips_qs = Trip.objects.all()
        if since is not None:
            trips_qs = trips_qs.filter(start_time__gte=since)
        trips_qs = trips_qs.order_by("-start_time")
 
        total_customers  = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_operators  = User.objects.filter(role=User.Role.OPERATOR).count()
        active_rentals   = active_rentals_qs.count()
        completed_trips  = trips_qs.count()
 
 
        customers_data = list(customers.values("id", "email", "name"))
        operators_data = list(operators.values("id", "email", "name"))
        rentals_data   = list(
            active_rentals_qs.values("vehicle", "user", "start_date_time", "end_date_time")
        )
        trips_data     = list(
            trips_qs.values("vehicle", "user", "start_time", "end_time")
        )
 
        return Response({
            "total_customers":      total_customers,
            "total_operators":      total_operators,
            "active_rentals":       active_rentals,
            "completed_trips":      completed_trips,
            
            "customers":            customers_data,
            "operators":            operators_data,
            "active_rentals_list":  rentals_data,
            "completed_trips_list": trips_data,
        })