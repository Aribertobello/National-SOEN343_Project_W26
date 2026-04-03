from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.utils import timezone
from rentals.models import Rental
from analytics.models import Trip
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
from core.models import City

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

class AdminCitiesView(APIView):
    """
    def _check_auth(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required."},
                            status=status.HTTP_401_UNAUTHORIZED)
        if request.user.role != User.Role.ADMIN:
            return Response({"detail": "Forbidden."},
                            status=status.HTTP_403_FORBIDDEN)
        return None
 
    def get(self, request):
        err = self._check_auth(request)
        if err:
            return err
        return self._build_response()
    """
 
    def get(self, request):
        return self._build_response()
 
 
    @staticmethod
    def _bbox(city):
        """Return (min_x, max_x, min_y, max_y) for a City instance."""
        xs = [city.top_left_x,  city.top_right_x,
              city.bottom_left_x, city.bottom_right_x]
        ys = [city.top_left_y,  city.top_right_y,
              city.bottom_left_y, city.bottom_right_y]
        return min(xs), max(xs), min(ys), max(ys)
 
    def _build_response(self):
        cities = City.objects.all().order_by("name")
        result = []
 
        for city in cities:
            min_x, max_x, min_y, max_y = self._bbox(city)
 
            spots_qs = ParkingSpot.objects.filter(
                location__x__gte=min_x, location__x__lte=max_x,
                location__y__gte=min_y, location__y__lte=max_y,
            )
            total_spots = spots_qs.count()
 

            reserved_spots = (
                ParkingReservation.objects
                .filter(parking_spot__in=spots_qs)
                .values("parking_spot")
                .distinct()
                .count()
            )
 
            utilization_pct = (
                round(reserved_spots / total_spots * 100, 1)
                if total_spots > 0 else 0.0
            )
 

            rentals_count = Rental.objects.filter(
                vehicle__location__x__gte=min_x,
                vehicle__location__x__lte=max_x,
                vehicle__location__y__gte=min_y,
                vehicle__location__y__lte=max_y,
            ).count()

            trips_count = Trip.objects.filter(
                start_location__x__gte=min_x,
                start_location__x__lte=max_x,
                start_location__y__gte=min_y,
                start_location__y__lte=max_y,
            ).count()
 
            result.append({
                "city":                    city.name,
                "total_parking_spots":     total_spots,
                "reserved_parking_spots":  reserved_spots,
                "parking_utilization_pct": utilization_pct,
                "rentals":                 rentals_count,
                "trips":                   trips_count,
            })
 
        return Response(result)
