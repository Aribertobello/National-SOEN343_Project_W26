from rest_framework import serializers
from .models import RentableVehicle, Rental
from core.models import Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Location
        fields = ['id', 'address', 'x', 'y']


class VehicleSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model  = RentableVehicle
        fields = ['id', 'type', 'status', 'rate', 'capacity', 'location']


class RentalSerializer(serializers.ModelSerializer):
    vehicle        = VehicleSerializer(read_only=True)
    vehicle_id     = serializers.PrimaryKeyRelatedField(
        queryset=RentableVehicle.objects.all(),
        source='vehicle',
        write_only=True
    )
    user_id        = serializers.IntegerField(source='user.id', read_only=True)
    payment_status = serializers.SerializerMethodField()
    total_cost     = serializers.SerializerMethodField()

    class Meta:
        model  = Rental
        fields = [
            'id', 'vehicle', 'vehicle_id', 'user_id',
            'status', 'start_date_time', 'end_date_time',
            'total_cost', 'payment_status',
        ]

    def get_total_cost(self, obj):
        return float(obj.payment.total) if obj.payment else None

    def get_payment_status(self, obj):
        return obj.payment.status if obj.payment else 'pending'