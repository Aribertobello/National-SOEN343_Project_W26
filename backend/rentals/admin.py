from django.contrib import admin
from .models import RentableVehicle, Rental, RentalStation

admin.site.register(RentableVehicle)
admin.site.register(Rental)
admin.site.register(RentalStation)
# Register your models here.
