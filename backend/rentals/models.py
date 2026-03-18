from django.db import models

from django.conf import settings
from core.models import Payment
from core.models import Vehicle


class RentableVehicle(Vehicle):
    class VehicleType(models.TextChoices):
        CAR = 'car', 'Car'
        ESCOOTER = 'escooter', 'EScooter'
        BIKE = 'bike', 'Bike'

    type = models.CharField(max_length=20, choices=VehicleType.choices)
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    overtime_rate = models.DecimalField(max_digits=8, decimal_places=2)
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)




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