from django.db.models import Count, Q, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import timedelta
from rentals.models import RentableVehicle, Rental


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

    # 1. Active rentals right now
    active_rentals = operator_rentals.filter(status="active").count()

    # 2. Available vehicles
    available_vehicles = operator_vehicles.filter(
        status=RentableVehicle.vehicleStatus.AVAILABLE
    ).count()

    # 3. Trips in look-back window
    trips_in_window = operator_rentals.filter(
        created_at__gte=since, status__in=["completed", "active"]
    ).count()

    # 4. Total trips all time
    total_trips = operator_rentals.filter(
        status__in=["completed", "active"]
    ).count()

    # 5. Most used vehicle type
    most_used_type = (
        operator_rentals.filter(status__in=["completed", "active"])
        .values("vehicle__type")
        .annotate(trip_count=Count("id"))
        .order_by("-trip_count")
        .first()
    )

    # 6. Usage per city
    usage_per_city = list(
        operator_rentals.filter(status__in=["completed", "active"])
        .values(city=F("vehicle__location__city__name"))
        .annotate(trips=Count("id"))
        .order_by("-trips")
    )

    # 7. Daily trip aggregates
    daily_trips = list(
        operator_rentals.filter(created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(trips=Count("id"))
        .order_by("day")
    )

    # 8. Vehicle type breakdown
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