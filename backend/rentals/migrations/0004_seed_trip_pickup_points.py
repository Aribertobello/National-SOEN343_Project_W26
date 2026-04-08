from decimal import Decimal

from django.conf import settings
from django.db import migrations


def seed_trip_pickup_points(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL.split(".")[0], settings.AUTH_USER_MODEL.split(".")[1])
    Location = apps.get_model("core", "Location")
    RentalStation = apps.get_model("rentals", "RentalStation")
    RentableVehicle = apps.get_model("rentals", "RentableVehicle")

    operator, _ = User.objects.get_or_create(
        username="seed_operator",
        defaults={
            "email": "seed.operator@summs.local",
            "name": "Seed Operator",
            "role": "operator",
            "password": "!",
            "is_staff": False,
            "is_superuser": False,
        },
    )

    car_location = Location.objects.filter(address__isnull=False).exclude(address="").order_by("id").first()
    bike_location = Location.objects.filter(address__isnull=False).exclude(address="").order_by("id")[1:2].first()

    if car_location is None and bike_location is None:
        return

    if car_location is not None:
        car_station, _ = RentalStation.objects.get_or_create(
            operator=operator,
            name="Downtown Car Hub",
            defaults={
                "type": "car",
                "location": car_location,
            },
        )
        if car_station.location_id != car_location.id or car_station.type != "car":
            car_station.location = car_location
            car_station.type = "car"
            car_station.save(update_fields=["location", "type"])

        if not RentableVehicle.objects.filter(type="car", station=car_station, status="available").exists():
            RentableVehicle.objects.create(
                type="car",
                rate=Decimal("18.00"),
                overtime_rate=Decimal("24.00"),
                capacity=5,
                operator=operator,
                station=car_station,
                location=car_location,
                status="available",
            )

    if bike_location is not None:
        bike_station, _ = RentalStation.objects.get_or_create(
            operator=operator,
            name="Campus Bike Hub",
            defaults={
                "type": "bike",
                "location": bike_location,
            },
        )
        if bike_station.location_id != bike_location.id or bike_station.type != "bike":
            bike_station.location = bike_location
            bike_station.type = "bike"
            bike_station.save(update_fields=["location", "type"])

        if not RentableVehicle.objects.filter(type="bike", station=bike_station, status="available").exists():
            RentableVehicle.objects.create(
                type="bike",
                rate=Decimal("4.00"),
                overtime_rate=Decimal("6.00"),
                capacity=1,
                operator=operator,
                station=bike_station,
                location=bike_location,
                status="available",
            )


def remove_seed_trip_pickup_points(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL.split(".")[0], settings.AUTH_USER_MODEL.split(".")[1])
    RentalStation = apps.get_model("rentals", "RentalStation")
    RentableVehicle = apps.get_model("rentals", "RentableVehicle")

    seed_user = User.objects.filter(username="seed_operator").first()
    if seed_user is None:
        return

    stations = RentalStation.objects.filter(operator=seed_user, name__in=["Downtown Car Hub", "Campus Bike Hub"])
    RentableVehicle.objects.filter(station__in=stations, type__in=["car", "bike"]).delete()
    stations.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("rentals", "0003_rentablevehicle_status_rental_status_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(seed_trip_pickup_points, remove_seed_trip_pickup_points),
    ]
