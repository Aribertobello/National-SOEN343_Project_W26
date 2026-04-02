from decimal import Decimal

from django.db import migrations, models


def seed_parking_spots(apps, schema_editor):
    Location = apps.get_model('core', 'Location')
    ParkingSpot = apps.get_model('parkings', 'ParkingSpot')

    if ParkingSpot.objects.exists():
        return

    seed_data = [
        ('Downtown Lot A', Decimal('45.501700'), Decimal('-73.567300'), Decimal('12.00')),
        ('Downtown Lot B', Decimal('45.503900'), Decimal('-73.568800'), Decimal('14.00')),
        ('Concordia Garage', Decimal('45.497300'), Decimal('-73.579100'), Decimal('10.00')),
        ('Peel Street Parking', Decimal('45.496700'), Decimal('-73.572600'), Decimal('11.50')),
        ('Old Port Spot', Decimal('45.507500'), Decimal('-73.553700'), Decimal('9.50')),
    ]

    for address, x, y, rate in seed_data:
        location = Location.objects.create(address=address, x=x, y=y)
        ParkingSpot.objects.create(location=location, rate=rate, is_available=True)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_location_address_alter_city_bottom_left_x_and_more'),
        ('parkings', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='parkingspot',
            name='is_available',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='parkingspot',
            name='reserved_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='parkingreservation',
            name='duration_minutes',
            field=models.PositiveIntegerField(default=60),
        ),
        migrations.RunPython(seed_parking_spots, migrations.RunPython.noop),
    ]
