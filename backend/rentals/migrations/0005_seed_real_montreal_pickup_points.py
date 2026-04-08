from decimal import Decimal

from django.conf import settings
from django.db import migrations


REAL_CAR_LOCATION = {
    "address": "1000 Rue De La Gauchetiere O, Montreal, QC H3B 4W5",
    "x": Decimal("45.497890"),
    "y": Decimal("-73.566120"),
}

REAL_BIKE_LOCATION = {
    "address": "1455 Rue Peel, Montreal, QC H3A 1S5",
    "x": Decimal("45.501230"),
    "y": Decimal("-73.572890"),
}


def seed_real_montreal_pickups(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL.split(".")[0], settings.AUTH_USER_MODEL.split(".")[1])
    Location = apps.get_model("core", "Location")
    RentalStation = apps.get_model("rentals", "RentalStation")
    RentableVehicle = apps.get_model("rentals", "RentableVehicle")

    operator = User.objects.filter(username="seed_operator").first()
    if operator is None:
        return

    car_location, _ = Location.objects.get_or_create(
        address=REAL_CAR_LOCATION["address"],
        defaults={"x": REAL_CAR_LOCATION["x"], "y": REAL_CAR_LOCATION["y"]},
    )
    bike_location, _ = Location.objects.get_or_create(
        address=REAL_BIKE_LOCATION["address"],
        defaults={"x": REAL_BIKE_LOCATION["x"], "y": REAL_BIKE_LOCATION["y"]},
    )

    car_station, _ = RentalStation.objects.get_or_create(
        operator=operator,
        name="Downtown Car Hub",
        defaults={"type": "car", "location": car_location},
    )
    if car_station.location_id != car_location.id or car_station.type != "car":
        car_station.location = car_location
        car_station.type = "car"
        car_station.save(update_fields=["location", "type"])

    bike_station, _ = RentalStation.objects.get_or_create(
        operator=operator,
        name="Campus Bike Hub",
        defaults={"type": "bike", "location": bike_location},
    )
    if bike_station.location_id != bike_location.id or bike_station.type != "bike":
        bike_station.location = bike_location
        bike_station.type = "bike"
        bike_station.save(update_fields=["location", "type"])

    car_vehicle = (
        RentableVehicle.objects.filter(type="car", operator=operator)
        .order_by("id")
        .first()
    )
    if car_vehicle is None:
        car_vehicle = RentableVehicle.objects.create(
            type="car",
            rate=Decimal("18.00"),
            overtime_rate=Decimal("24.00"),
            capacity=5,
            operator=operator,
            station=car_station,
            location=car_location,
            status="available",
        )
    else:
        car_vehicle.station = car_station
        car_vehicle.location = car_location
        car_vehicle.status = "available"
        car_vehicle.save(update_fields=["station", "location", "status"])

    bike_vehicle = (
        RentableVehicle.objects.filter(type="bike", operator=operator)
        .order_by("id")
        .first()
    )
    if bike_vehicle is None:
        bike_vehicle = RentableVehicle.objects.create(
            type="bike",
            rate=Decimal("4.00"),
            overtime_rate=Decimal("6.00"),
            capacity=1,
            operator=operator,
            station=bike_station,
            location=bike_location,
            status="available",
        )
    else:
        bike_vehicle.station = bike_station
        bike_vehicle.location = bike_location
        bike_vehicle.status = "available"
        bike_vehicle.save(update_fields=["station", "location", "status"])


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("rentals", "0004_seed_trip_pickup_points"),
    ]

    operations = [
        migrations.RunPython(seed_real_montreal_pickups, noop_reverse),
    ]
