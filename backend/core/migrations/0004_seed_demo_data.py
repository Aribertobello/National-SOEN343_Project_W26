from datetime import datetime, timedelta, timezone as dt_timezone
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_demo_data(apps, schema_editor):
    auth_app, auth_model = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(auth_app, auth_model)
    City = apps.get_model("core", "City")
    Location = apps.get_model("core", "Location")
    Payment = apps.get_model("core", "Payment")
    RentalStation = apps.get_model("rentals", "RentalStation")
    RentableVehicle = apps.get_model("rentals", "RentableVehicle")
    Rental = apps.get_model("rentals", "Rental")
    ParkingSpot = apps.get_model("parkings", "ParkingSpot")
    ParkingReservation = apps.get_model("parkings", "ParkingReservation")
    Trip = apps.get_model("analytics", "Trip")

    montreal, _ = City.objects.get_or_create(
        name="Montreal",
        defaults={
            "top_left_x": Decimal("45.700000"),
            "top_left_y": Decimal("-73.800000"),
            "top_right_x": Decimal("45.700000"),
            "top_right_y": Decimal("-73.400000"),
            "bottom_left_x": Decimal("45.300000"),
            "bottom_left_y": Decimal("-73.800000"),
            "bottom_right_x": Decimal("45.300000"),
            "bottom_right_y": Decimal("-73.400000"),
        },
    )

    users_seed = [
        {"username": "demo_admin", "email": "admin.demo@summs.local", "name": "Demo Admin", "role": "admin"},
        {"username": "demo_operator", "email": "operator.demo@summs.local", "name": "Demo Operator", "role": "operator"},
        {"username": "demo_client_1", "email": "client1.demo@summs.local", "name": "Camille Tremblay", "role": "customer"},
        {"username": "demo_client_2", "email": "client2.demo@summs.local", "name": "Olivier Gagnon", "role": "customer"},
        {"username": "demo_client_3", "email": "client3.demo@summs.local", "name": "Sophie Roy", "role": "customer"},
    ]

    users = {}
    for item in users_seed:
        user, _ = User.objects.get_or_create(
            username=item["username"],
            defaults={
                "email": item["email"],
                "name": item["name"],
                "role": item["role"],
                "is_active": True,
                "password": make_password("demo1234"),
            },
        )
        users[item["username"]] = user

    location_seed = [
        ("1000 Rue De La Gauchetiere O, Montreal, QC H3B 4W5", Decimal("45.497890"), Decimal("-73.566120")),
        ("1455 Rue Peel, Montreal, QC H3A 1S5", Decimal("45.501230"), Decimal("-73.572890")),
        ("2001 Av McGill College, Montreal, QC H3A 1G1", Decimal("45.504510"), Decimal("-73.571080")),
        ("400 Rue Sainte-Catherine E, Montreal, QC H2L 2C5", Decimal("45.516780"), Decimal("-73.561230")),
        ("900 Boul De Maisonneuve E, Montreal, QC H2L 1Y8", Decimal("45.518230"), Decimal("-73.557890")),
        ("1380 Rue Laurier E, Montreal, QC H2J 1H5", Decimal("45.531670"), Decimal("-73.575230")),
        ("3200 Rue Sherbrooke E, Montreal, QC H1W 1C3", Decimal("45.527890"), Decimal("-73.545670")),
        ("5800 Boul Decarie, Montreal, QC H3X 2K3", Decimal("45.474510"), Decimal("-73.634560")),
        ("6521 Av Somerled, Montreal, QC H4V 1S7", Decimal("45.467800"), Decimal("-73.638690")),
        ("3150 Rue Remembrance, Montreal, QC H8T 1Y3", Decimal("45.539354"), Decimal("-73.582369")),
        ("5100 Rue Sherbrooke O, Montreal, QC H4A 1T3", Decimal("45.469300"), Decimal("-73.605820")),
        ("4600 Av De Maisonneuve O, Montreal, QC H3Z 1L7", Decimal("45.475230"), Decimal("-73.597410")),
    ]

    locations = []
    for address, x, y in location_seed:
        location, _ = Location.objects.get_or_create(
            address=address,
            defaults={"x": x, "y": y, "city": montreal},
        )
        if location.city_id is None:
            location.city = montreal
            location.save(update_fields=["city"])
        locations.append(location)

    operator = users["demo_operator"]

    station_seed = [
        ("Downtown Car Hub", "car", locations[0]),
        ("Plateau Bike Hub", "bike", locations[5]),
        ("McGill Micromobility", "escooter", locations[2]),
        ("Old Port Car Hub", "car", locations[9]),
        ("Concordia Bike Hub", "bike", locations[11]),
    ]

    stations = {}
    for name, station_type, location in station_seed:
        station, _ = RentalStation.objects.get_or_create(
            name=name,
            operator=operator,
            defaults={"type": station_type, "location": location},
        )
        if station.type != station_type or station.location_id != location.id:
            station.type = station_type
            station.location = location
            station.save(update_fields=["type", "location"])
        stations[name] = station

    vehicle_seed = [
        ("car", Decimal("19.00"), Decimal("25.00"), 5, "Downtown Car Hub", "available"),
        ("car", Decimal("21.00"), Decimal("27.00"), 5, "Old Port Car Hub", "available"),
        ("car", Decimal("18.00"), Decimal("24.00"), 5, "Downtown Car Hub", "rented-out"),
        ("bike", Decimal("4.50"), Decimal("6.00"), 1, "Plateau Bike Hub", "available"),
        ("bike", Decimal("4.00"), Decimal("5.50"), 1, "Concordia Bike Hub", "available"),
        ("bike", Decimal("4.25"), Decimal("5.75"), 1, "Concordia Bike Hub", "rented-out"),
        ("escooter", Decimal("5.50"), Decimal("7.00"), 1, "McGill Micromobility", "available"),
        ("escooter", Decimal("5.25"), Decimal("6.75"), 1, "McGill Micromobility", "available"),
        ("escooter", Decimal("5.75"), Decimal("7.25"), 1, "McGill Micromobility", "maintenence"),
    ]

    vehicles = []
    for v_type, rate, overtime_rate, capacity, station_name, status in vehicle_seed:
        station = stations[station_name]
        vehicle, _ = RentableVehicle.objects.get_or_create(
            type=v_type,
            rate=rate,
            overtime_rate=overtime_rate,
            capacity=capacity,
            station=station,
            operator=operator,
            defaults={"location": station.location, "status": status},
        )
        if vehicle.location_id != station.location_id or vehicle.status != status:
            vehicle.location = station.location
            vehicle.status = status
            vehicle.save(update_fields=["location", "status"])
        vehicles.append(vehicle)

    parking_rates = [Decimal("3.50"), Decimal("4.00"), Decimal("4.25"), Decimal("3.75"), Decimal("4.50"), Decimal("5.00")]
    parking_spots = []
    for idx, location in enumerate(locations[:6]):
        rate = parking_rates[idx % len(parking_rates)]
        spot, _ = ParkingSpot.objects.get_or_create(
            location=location,
            rate=rate,
            defaults={"is_available": True},
        )
        parking_spots.append(spot)

    tz_now = datetime.now(dt_timezone.utc)
    client_users = [users["demo_client_1"], users["demo_client_2"], users["demo_client_3"]]

    rental_seed = [
        (vehicles[2], client_users[0], "active", tz_now - timedelta(hours=1), None, Decimal("19.00"), "pending"),
        (vehicles[5], client_users[1], "active", tz_now - timedelta(minutes=35), None, Decimal("4.25"), "pending"),
        (vehicles[0], client_users[2], "completed", tz_now - timedelta(days=1, hours=2), tz_now - timedelta(days=1, hours=1), Decimal("38.00"), "paid"),
        (vehicles[3], client_users[0], "completed", tz_now - timedelta(days=2, hours=3), tz_now - timedelta(days=2, hours=2), Decimal("9.00"), "paid"),
    ]

    rentals = []
    for vehicle, user, status, start_dt, end_dt, total, payment_status in rental_seed:
        payment, _ = Payment.objects.get_or_create(
            total=total,
            status=payment_status,
        )
        rental, _ = Rental.objects.get_or_create(
            vehicle=vehicle,
            user=user,
            start_date_time=start_dt,
            defaults={
                "status": status,
                "end_date_time": end_dt,
                "payment": payment,
                "created_at": start_dt,
            },
        )
        if rental.payment_id is None:
            rental.payment = payment
            rental.save(update_fields=["payment"])
        rentals.append(rental)

    trip_seed = [
        (vehicles[2], client_users[0], locations[0], locations[1], tz_now - timedelta(minutes=55), tz_now - timedelta(minutes=20)),
        (vehicles[5], client_users[1], locations[11], locations[2], tz_now - timedelta(minutes=30), tz_now - timedelta(minutes=5)),
        (vehicles[0], client_users[2], locations[0], locations[9], tz_now - timedelta(days=1, hours=2), tz_now - timedelta(days=1, hours=1, minutes=10)),
    ]

    for vehicle, user, start_loc, end_loc, start_dt, end_dt in trip_seed:
        Trip.objects.get_or_create(
            vehicle=vehicle,
            user=user,
            start_location=start_loc,
            end_location=end_loc,
            start_time=start_dt,
            end_time=end_dt,
        )

    parking_res_seed = [
        (client_users[0], parking_spots[0], 60, tz_now - timedelta(hours=2), tz_now - timedelta(hours=1), Decimal("3.50"), "paid"),
        (client_users[1], parking_spots[1], 90, tz_now - timedelta(hours=1, minutes=30), tz_now - timedelta(minutes=15), Decimal("6.00"), "paid"),
        (client_users[2], parking_spots[2], 120, tz_now - timedelta(minutes=10), tz_now + timedelta(hours=1, minutes=50), Decimal("8.50"), "pending"),
    ]

    for user, spot, duration, start_dt, end_dt, total, payment_status in parking_res_seed:
        payment, _ = Payment.objects.get_or_create(total=total, status=payment_status)
        reservation, _ = ParkingReservation.objects.get_or_create(
            user=user,
            parking_spot=spot,
            start_at=start_dt,
            defaults={
                "duration_minutes": duration,
                "end_at": end_dt,
                "payment": payment,
            },
        )
        if reservation.payment_id is None:
            reservation.payment = payment
            reservation.save(update_fields=["payment"])


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_location_city"),
        ("users", "0004_user_name"),
        ("rentals", "0005_seed_real_montreal_pickup_points"),
        ("parkings", "0003_reservation_window_and_seed_availability"),
        ("analytics", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_demo_data, noop_reverse),
    ]
