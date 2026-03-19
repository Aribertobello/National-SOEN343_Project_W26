from django.db import models



class Vehicle(models.Model):
    capacity = models.IntegerField()

class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        PAID = 'paid', 'Paid'
        PENDING = 'pending', 'Pending'
        FAILED = 'failed', 'Failed'

    status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    total = models.DecimalField(max_digits=8, decimal_places=2)

class Location(models.Model):

    address = models.CharField(max_length=255, default="uknown")
    x = models.DecimalField(max_digits=8, decimal_places=6)
    y = models.DecimalField(max_digits=8, decimal_places=6)


class City(models.Model):
    name = models.CharField(max_length=100)
    top_left_x = models.DecimalField(max_digits=8, decimal_places=6)
    top_left_y = models.DecimalField(max_digits=8, decimal_places=6)
    top_right_x = models.DecimalField(max_digits=8, decimal_places=6)
    top_right_y = models.DecimalField(max_digits=8, decimal_places=6)
    bottom_left_x = models.DecimalField(max_digits=8, decimal_places=6)
    bottom_left_y = models.DecimalField(max_digits=8, decimal_places=6)
    bottom_right_x = models.DecimalField(max_digits=8, decimal_places=6)
    bottom_right_y = models.DecimalField(max_digits=8, decimal_places=6)
