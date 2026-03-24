from django.db import models

from django.conf import settings
from core.models import Payment
from core.models import Vehicle
from core.models import Location

class RentalStation(models.Model):

    class stationType(models.TextChoices):
        CAR = 'car', 'Car'
        ESCOOTER = 'escooter', 'EScooter'
        BIKE = 'bike', 'Bike'

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=stationType.choices, default=stationType.BIKE) 
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)

class RentableVehicle(Vehicle):
    class VehicleType(models.TextChoices):
        CAR = 'car', 'Car'
        ESCOOTER = 'escooter', 'EScooter'
        BIKE = 'bike', 'Bike'

    class rentalStatus(models.TextChoices):
        AVAILABLE = 'available', 'Available' 
        RENTEDOUT = 'rented-out', "Rented-Out"
        OUTOFSERVICE = 'out-of-service','Out-Of-Service'

    type = models.CharField(max_length=20, choices=VehicleType.choices)
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    overtime_rate = models.DecimalField(max_digits=8, decimal_places=2)
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    station = models.ForeignKey(RentalStation, on_delete=models.CASCADE, null=True, blank=True)
    location = models.ForeignKey(Location, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=rentalStatus.choices, default=rentalStatus.AVAILABLE)



class Rental(models.Model):
    vehicle = models.ForeignKey(RentableVehicle, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment = models.OneToOneField(Payment, null=True, blank=True, on_delete=models.SET_NULL)
    start_date_time = models.DateTimeField()
    end_date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.payment:
            self.payment = Payment.objects.create(
                total=0, 
                status=Payment.PaymentStatus.PENDING
            )
        super().save(*args, **kwargs)