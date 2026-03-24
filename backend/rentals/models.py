from django.db import models
from django.conf import settings
from core.models import Payment, Vehicle, Location


class RentalStation(models.Model):
    name     = models.CharField(max_length=100)
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class RentableVehicle(Vehicle):
    class VehicleType(models.TextChoices):
        CAR      = 'car',      'Car'
        ESCOOTER = 'escooter', 'EScooter'
        BIKE     = 'bike',     'Bike'

    class VehicleStatus(models.TextChoices):
        AVAILABLE   = 'available',   'Available'
        RENTED      = 'rented',      'Rented'
        MAINTENANCE = 'maintenance', 'Maintenance'

    type          = models.CharField(max_length=20, choices=VehicleType.choices)
    status        = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.AVAILABLE)
    rate          = models.DecimalField(max_digits=8, decimal_places=2)
    overtime_rate = models.DecimalField(max_digits=8, decimal_places=2)
    operator      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    station       = models.ForeignKey(RentalStation, null=True, blank=True, on_delete=models.CASCADE)
    location      = models.ForeignKey(Location, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.type} #{self.pk} ({self.status})"


class Rental(models.Model):
    class RentalStatus(models.TextChoices):
        ACTIVE    = 'active',    'Active'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    vehicle         = models.ForeignKey(RentableVehicle, on_delete=models.CASCADE)
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment         = models.OneToOneField(Payment, null=True, blank=True, on_delete=models.SET_NULL)
    status          = models.CharField(max_length=20, choices=RentalStatus.choices, default=RentalStatus.ACTIVE)
    start_date_time = models.DateTimeField(auto_now_add=True)
    end_date_time   = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.payment_id:
            self.payment = Payment.objects.create(
                total=0,
                status=Payment.PaymentStatus.PENDING
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rental #{self.pk} - {self.user} - {self.status}"