from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import Trip
from core.models import City, Location
from parkings.models import ParkingReservation, ParkingSpot
from rentals.models import RentableVehicle, Rental

User = get_user_model()

ALLOWED_USER_LIMITS = {10, 25, 50, 100}
DEFAULT_USER_LIMIT = 50

TIME_RANGE_DELTAS = {
    "week": timedelta(weeks=1),
    "month": timedelta(days=30),
}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    user = request.user
    city_filter = request.query_params.get("city")
    days = int(request.query_params.get("days", 30))
    since = timezone.now() - timedelta(days=days)

    operator_vehicles = RentableVehicle.objects.filter(operator=user)
    if city_filter:
        operator_vehicles = operator_vehicles.filter(
            location__city__name__iexact=city_filter
        )

    operator_rentals = Rental.objects.filter(vehicle__in=operator_vehicles)

    active_rentals = operator_rentals.filter(status="active").count()

    available_vehicles = operator_vehicles.filter(
        status=RentableVehicle.vehicleStatus.AVAILABLE
    ).count()

    trips_in_window = operator_rentals.filter(
        created_at__gte=since, status__in=["completed", "active"]
    ).count()

    total_trips = operator_rentals.filter(
        status__in=["completed", "active"]
    ).count()

    most_used_type = (
        operator_rentals.filter(status__in=["completed", "active"])
        .values("vehicle__type")
        .annotate(trip_count=Count("id"))
        .order_by("-trip_count")
        .first()
    )

    usage_per_city = list(
        operator_rentals.filter(status__in=["completed", "active"])
        .values(city=F("vehicle__location__city__name"))
        .annotate(trips=Count("id"))
        .order_by("-trips")
    )

    daily_trips = list(
        operator_rentals.filter(created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(trips=Count("id"))
        .order_by("day")
    )

    vehicle_type_breakdown = list(
        operator_vehicles.values(vehicle_type=F("type"))
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return Response(
        {
            "summary": {
                "active_rentals": active_rentals,
                "available_vehicles": available_vehicles,
                "trips_last_n_days": trips_in_window,
                "total_trips": total_trips,
                "days_window": days,
            },
            "most_used_vehicle_type": most_used_type["vehicle__type"]
            if most_used_type
            else None,
            "usage_per_city": usage_per_city,
            "daily_trips": [
                {"date": str(row["day"]), "trips": row["trips"]} for row in daily_trips
            ],
            "vehicle_type_breakdown": vehicle_type_breakdown,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def system_analytics(request):
    since_30d = timezone.now() - timedelta(days=30)

    total_active_rentals = Rental.objects.filter(status="active").count()

    most_used = (
        Rental.objects.filter(status__in=["completed", "active"])
        .values("vehicle__type")
        .annotate(count=Count("id"))
        .order_by("-count")
        .first()
    )

    city_usage = list(
        Rental.objects.filter(status__in=["completed", "active"])
        .values(city=F("vehicle__location__city__name"))
        .annotate(trips=Count("id"))
        .order_by("-trips")[:10]
    )

    total_trips_30d = Rental.objects.filter(
        created_at__gte=since_30d, status__in=["completed", "active"]
    ).count()

    return Response(
        {
            "total_active_rentals": total_active_rentals,
            "most_used_vehicle_type": most_used["vehicle__type"]
            if most_used
            else None,
            "city_usage": city_usage,
            "total_trips_last_30_days": total_trips_30d,
        }
    )


class AdminOverviewView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

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

        since = now - TIME_RANGE_DELTAS[time_range] if time_range in TIME_RANGE_DELTAS else None

        customers = User.objects.filter(role=User.Role.CUSTOMER).order_by("-id")[:user_limit]
        operators = User.objects.filter(role=User.Role.OPERATOR).order_by("-id")[:user_limit]

        active_rentals_qs = Rental.objects.filter(end_date_time__gte=now)
        if since is not None:
            active_rentals_qs = active_rentals_qs.filter(start_date_time__gte=since)
        active_rentals_qs = active_rentals_qs.order_by("-start_date_time")

        trips_qs = Trip.objects.all()
        if since is not None:
            trips_qs = trips_qs.filter(start_time__gte=since)
        trips_qs = trips_qs.order_by("-start_time")

        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_operators = User.objects.filter(role=User.Role.OPERATOR).count()
        active_rentals = active_rentals_qs.count()
        completed_trips = trips_qs.count()

        active_vehicle_ids = active_rentals_qs.values_list("vehicle_id", flat=True).distinct()

        total_cars_rental = RentableVehicle.objects.filter(
            type=RentableVehicle.VehicleType.CAR, id__in=active_vehicle_ids
        ).count()
        total_escooters_rental = RentableVehicle.objects.filter(
            type=RentableVehicle.VehicleType.ESCOOTER, id__in=active_vehicle_ids
        ).count()
        total_bikes_rental = RentableVehicle.objects.filter(
            type=RentableVehicle.VehicleType.BIKE, id__in=active_vehicle_ids
        ).count()

        customers_data = list(customers.values("id", "email", "name"))
        operators_data = list(operators.values("id", "email", "name"))
        rentals_data = list(
            active_rentals_qs.values("vehicle_id", "vehicle", "user_id", "start_date_time", "end_date_time")
        )
        trips_data = list(trips_qs.values("vehicle", "user", "start_time", "end_time"))

        return Response(
            {
                "total_customers": total_customers,
                "total_operators": total_operators,
                "active_rentals": active_rentals,
                "completed_trips": completed_trips,
                "total_cars_rental": total_cars_rental,
                "total_escooters_rental": total_escooters_rental,
                "total_bikes_rental": total_bikes_rental,
                "customers": customers_data,
                "operators": operators_data,
                "active_rentals_list": rentals_data,
                "completed_trips_list": trips_data,
            }
        )


class AdminCitiesView(APIView):
    def _check_auth(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if request.user.role != User.Role.ADMIN:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get(self, request):
        err = self._check_auth(request)
        if err:
            return err
        return self._build_response()

    @staticmethod
    def _bbox(city):
        xs = [city.top_left_x, city.top_right_x, city.bottom_left_x, city.bottom_right_x]
        ys = [city.top_left_y, city.top_right_y, city.bottom_left_y, city.bottom_right_y]
        return min(xs), max(xs), min(ys), max(ys)

    def _build_response(self):
        cities = City.objects.all().order_by("name")
        result = []

        for city in cities:
            min_x, max_x, min_y, max_y = self._bbox(city)

            spots_qs = ParkingSpot.objects.filter(
                location__x__gte=min_x,
                location__x__lte=max_x,
                location__y__gte=min_y,
                location__y__lte=max_y,
            )
            total_spots = spots_qs.count()

            reserved_spots = (
                ParkingReservation.objects.filter(parking_spot__in=spots_qs)
                .values("parking_spot")
                .distinct()
                .count()
            )

            utilization_pct = round(reserved_spots / total_spots * 100, 1) if total_spots > 0 else 0.0

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

            result.append(
                {
                    "city": city.name,
                    "total_parking_spots": total_spots,
                    "reserved_parking_spots": reserved_spots,
                    "parking_utilization_pct": utilization_pct,
                    "rentals": rentals_count,
                    "trips": trips_count,
                }
            )

        return Response(result)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_trip(request):
    vehicle_id = request.data.get("vehicle_id")
    start_location_id = request.data.get("start_location_id")
    end_location_id = request.data.get("end_location_id")

    if not vehicle_id or not start_location_id or not end_location_id:
        return Response(
            {"error": "vehicle_id, start_location_id and end_location_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        vehicle = RentableVehicle.objects.get(pk=vehicle_id)
    except RentableVehicle.DoesNotExist:
        return Response({"error": "Vehicle not found."}, status=status.HTTP_404_NOT_FOUND)

    if vehicle.status != RentableVehicle.vehicleStatus.AVAILABLE:
        return Response(
            {"error": "Vehicle is not available."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        start_location = Location.objects.get(pk=start_location_id)
        end_location = Location.objects.get(pk=end_location_id)
    except Location.DoesNotExist:
        return Response({"error": "Location not found."}, status=status.HTTP_404_NOT_FOUND)

    if start_location.id == end_location.id:
        return Response(
            {"error": "Start and destination locations must be different."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if vehicle.location_id and vehicle.location_id != start_location.id:
        return Response(
            {"error": "Vehicle is not at the selected pickup location."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    trip = Trip.objects.create(
        vehicle=vehicle,
        start_location=start_location,
        end_location=end_location,
        user=request.user,
        start_time=now,
        end_time=now,
    )

    return Response(
        {
            "id": trip.id,
            "vehicle_id": vehicle.id,
            "start_location_id": start_location.id,
            "end_location_id": end_location.id,
            "start_time": trip.start_time,
            "message": "Trip created.",
        },
        status=status.HTTP_201_CREATED,
    )
