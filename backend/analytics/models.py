from django.db import models
from django.conf import settings
from core.models import Vehicle
from core.models import Location

# Use this if we do the transport vehicle stuff, but place it in a new app called transit or something
#class TransitVehicle(models.Model):
#    class VehicleType(models.TextChoices):
#        BUS = 'bus', 'Bus'
#        TRAIN = 'train', 'Train'
#
#    capacity = models.IntegerField()
#    type = models.CharField(max_length=20, choices=VehicleType.choices)
#    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)


class Trip(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    start_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='trip_starts')
    end_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='trip_ends')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()