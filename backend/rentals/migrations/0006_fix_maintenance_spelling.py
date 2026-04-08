from django.db import migrations, models


def forwards_fix_status_spelling(apps, schema_editor):
    RentableVehicle = apps.get_model("rentals", "RentableVehicle")
    RentableVehicle.objects.filter(status="maintenence").update(status="maintenance")


def backwards_fix_status_spelling(apps, schema_editor):
    RentableVehicle = apps.get_model("rentals", "RentableVehicle")
    RentableVehicle.objects.filter(status="maintenance").update(status="maintenence")


class Migration(migrations.Migration):

    dependencies = [
        ("rentals", "0005_seed_real_montreal_pickup_points"),
    ]

    operations = [
        migrations.RunPython(forwards_fix_status_spelling, backwards_fix_status_spelling),
        migrations.AlterField(
            model_name="rentablevehicle",
            name="status",
            field=models.CharField(
                choices=[
                    ("available", "Available"),
                    ("rented-out", "Rented-Out"),
                    ("maintenance", "Maintenance"),
                ],
                default="available",
                max_length=20,
            ),
        ),
    ]
