from django.contrib import admin
from .models import Vehicle, Location, City, Payment

admin.site.register(Location)
admin.site.register(City)
admin.site.register(Payment)
# Register your models here.
