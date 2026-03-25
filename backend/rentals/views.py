from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import RentableVehicle, Rental
from .serializers import VehicleSerializer, RentalSerializer


# GET /api/rentals/vehicles/?type=bike
@api_view(['GET'])
def vehicle_list(request):
    vehicle_type = request.query_params.get('type')
    qs = RentableVehicle.objects.select_related('location')
    if vehicle_type:
        qs = qs.filter(type=vehicle_type)
    return Response(VehicleSerializer(qs, many=True).data)


# GET /api/rentals/vehicles/:id/
@api_view(['GET'])
def vehicle_detail(request, pk):
    try:
        vehicle = RentableVehicle.objects.select_related('location').get(pk=pk)
    except RentableVehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(VehicleSerializer(vehicle).data)


# GET /api/rentals/rentals/
# POST /api/rentals/rentals/
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rental_list_create(request):
    if request.method == 'GET':
        rentals = Rental.objects.filter(user=request.user).select_related(
            'vehicle', 'vehicle__location', 'payment'
        ).order_by('-created_at')
        return Response(RentalSerializer(rentals, many=True).data)

    # POST — create a new rental
    vehicle_id = request.data.get('vehicle_id')
    if not vehicle_id:
        return Response({'error': 'vehicle_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        vehicle = RentableVehicle.objects.get(pk=vehicle_id)
    except RentableVehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)

    if vehicle.status != RentableVehicle.VehicleStatus.AVAILABLE:
        return Response({'error': 'Vehicle is not available'}, status=status.HTTP_400_BAD_REQUEST)

    if Rental.objects.filter(
        user=request.user,
        vehicle=vehicle,
        status=Rental.RentalStatus.ACTIVE
    ).exists():
        return Response(
            {'error': 'You already have an active rental for this vehicle'},
            status=status.HTTP_400_BAD_REQUEST
        )

    rental = Rental.objects.create(
        vehicle=vehicle,
        user=request.user,
        status=Rental.RentalStatus.ACTIVE,
    )

    vehicle.status = RentableVehicle.VehicleStatus.RENTED
    vehicle.save()

    return Response(RentalSerializer(rental).data, status=status.HTTP_201_CREATED)


# PATCH /api/rentals/rentals/:id/return/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def rental_return(request, pk):
    try:
        rental = Rental.objects.select_related('vehicle', 'payment').get(
            pk=pk, user=request.user
        )
    except Rental.DoesNotExist:
        return Response({'error': 'Rental not found'}, status=status.HTTP_404_NOT_FOUND)

    if rental.status != Rental.RentalStatus.ACTIVE:
        return Response({'error': 'Rental is not active'}, status=status.HTTP_400_BAD_REQUEST)

    end_time       = timezone.now()
    duration_hours = (end_time - rental.start_date_time).total_seconds() / 3600
    rate           = float(rental.vehicle.rate)
    min_hours      = 2.0 if rental.vehicle.type == 'car' else 1.0
    billable_hours = max(min_hours, duration_hours)
    total_cost     = round(rate * billable_hours, 2)

    rental.status       = Rental.RentalStatus.COMPLETED
    rental.end_date_time = end_time
    rental.save()

    if rental.payment:
        rental.payment.total  = total_cost
        rental.payment.status = 'paid'
        rental.payment.save()

    rental.vehicle.status = RentableVehicle.VehicleStatus.AVAILABLE
    rental.vehicle.save()

    return Response(RentalSerializer(rental).data)