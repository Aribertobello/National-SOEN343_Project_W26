from datetime import timedelta

from django.db import migrations, models
from django.utils import timezone


def seed_unavailable_spots(apps, schema_editor):
    ParkingSpot = apps.get_model('parkings', 'ParkingSpot')

    spots = list(ParkingSpot.objects.order_by('id')[:3])
    if len(spots) < 3:
        return

    now = timezone.now()

    # Spot 1 unavailable for the next 25 minutes.
    spots[0].is_available = False
    spots[0].reserved_until = now + timedelta(minutes=25)
    spots[0].save(update_fields=['is_available', 'reserved_until'])

    # Spot 2 unavailable for the next 90 minutes.
    spots[1].is_available = False
    spots[1].reserved_until = now + timedelta(minutes=90)
    spots[1].save(update_fields=['is_available', 'reserved_until'])

    # Spot 3 remains available.
    spots[2].is_available = True
    spots[2].reserved_until = None
    spots[2].save(update_fields=['is_available', 'reserved_until'])


class Migration(migrations.Migration):

    dependencies = [
        ('parkings', '0002_parking_availability_and_seed'),
    ]

    operations = [
        migrations.AddField(
            model_name='parkingreservation',
            name='start_at',
            field=models.DateTimeField(default=timezone.now),
        ),
        migrations.AddField(
            model_name='parkingreservation',
            name='end_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(seed_unavailable_spots, migrations.RunPython.noop),
    ]
