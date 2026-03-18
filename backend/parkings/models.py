from django.db import models
from django.conf import settings
from core.models import Location
from core.models import Payment

class ParkingSpot(models.Model):

    rate = models.DecimalField(max_digits=8, decimal_places=2)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)


class ParkingReservation(models.Model):

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parking_spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE)
    payment = models.OneToOneField(Payment, null=True, blank=True, on_delete=models.SET_NULL)

    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.payment:
            self.payment = Payment.objects.create(
                total=0, 
                status=Payment.PaymentStatus.PENDING
            )
        super().save(*args, **kwargs)
