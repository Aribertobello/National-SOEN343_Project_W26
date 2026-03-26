from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import RentableVehicle, Rental
from .serializers import RentalSerializer
from .models import RentalStation
from core.models import Location

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

    if vehicle.status != RentableVehicle.vehicleStatus.AVAILABLE:
        return Response({'error': 'Vehicle is not available'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user already has an active rental for this vehicle
    if Rental.objects.filter(
        user=request.user,
        vehicle=vehicle,
        status=Rental.RentalStatus.ACTIVE
    ).exists():
        return Response({'error': 'You already have an active rental for this vehicle'},
                        status=status.HTTP_400_BAD_REQUEST)

    # ── Compute start and end times ──
    start_time = timezone.now()
    end_time = request.data.get('end_date_time')
    if end_time:
        try:
            # Parse ISO string from frontend
            end_time = timezone.datetime.fromisoformat(end_time)
            end_time = timezone.make_aware(end_time)
        except ValueError:
            return Response({'error': 'Invalid end_date_time format'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        end_time = None

    # ── Calculate billable hours and total cost ──
    rate = float(vehicle.rate)
    min_hours = 2.0 if vehicle.type == 'car' else 1.0
    if end_time:
        duration_hours = (end_time - start_time).total_seconds() / 3600
        billable_hours = max(min_hours, duration_hours)
    else:
        billable_hours = min_hours  # default minimum if no end time

    total_cost = round(rate * billable_hours, 2)

    # ── Create rental and payment ──
    rental = Rental.objects.create(
        vehicle=vehicle,
        user=request.user,
        status=Rental.RentalStatus.ACTIVE,
        start_date_time=start_time,
        end_date_time=end_time,
    )

    rental.payment.total = total_cost
    rental.payment.status = 'pending'
    rental.payment.save()

    # ── Mark vehicle as rented ──
    vehicle.status = RentableVehicle.vehicleStatus.RENTEDOUT
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

    rental.vehicle.status = RentableVehicle.vehicleStatus.AVAILABLE
    rental.vehicle.save()

    return Response(RentalSerializer(rental).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def operator_stations(request):
    if request.method == 'GET':
        stations = RentalStation.objects.filter(operator=request.user)
        data = [
            {
                'id': s.id,
                'name': s.name,
                'type': s.type,
                'location': {
                    'id': s.location.id,
                    'address': s.location.address,
                    'x': s.location.x,
                    'y': s.location.y,
                }
            }
            for s in stations
        ]
        return Response(data)

    if request.method == 'POST':
        data = request.data

        required = ['name', 'type', 'location_id']
        for field in required:
            if not data.get(field):
                return Response({'error': f'{field} is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if data['type'] not in RentalStation.stationType.values:
            return Response({'error': 'Invalid station type.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            location = Location.objects.get(id=data['location_id'])
        except Location.DoesNotExist:
            return Response({'error': 'Location not found.'}, status=status.HTTP_404_NOT_FOUND)

        station = RentalStation.objects.create(
            name=data['name'],
            type=data['type'],
            operator=request.user,
            location=location,
        )

        return Response({
            'id': station.id,
            'name': station.name,
            'type': station.type,
            'location': {
                'id': location.id,
                'address': location.address,
                'x': location.x,
                'y': location.y,
            }
        }, status=status.HTTP_201_CREATED)
    
@api_view(['GET', 'POST', "DELETE"])
@permission_classes([IsAuthenticated])
def operator_vehicles(request):

    if request.method == 'GET':
        vehicles = (
            RentableVehicle.objects
            .filter(operator=request.user)
            .select_related('station', 'location')
        )

        # active rentals only
        rentals = {
            r.vehicle_id: r
            for r in Rental.objects.filter(
                vehicle__operator=request.user,
                status=Rental.RentalStatus.ACTIVE
            ).select_related('user')
        }

        data = []
        for v in vehicles:
            r = rentals.get(v.id)

            data.append({
                'id': v.id,
                'type': v.type,
                'status': v.status,
                'rate': float(v.rate),
                'overtime_rate': float(v.overtime_rate),
                'capacity': v.capacity,

                'station': {
                    'id': v.station.id,
                    'name': v.station.name,
                    'type': v.station.type,
                } if v.station else None,

                'location': {
                    'id': v.location.id,
                    'address': v.location.address,
                    'x': float(v.location.x),
                    'y': float(v.location.y),
                } if v.location else None,

                # 👇 THIS MATCHES YOUR FRONTEND
                'rental': {
                    'id': r.id,
                    'user': r.user.email,
                    'start_date_time': r.start_date_time,
                } if r else None,
            })

        return Response(data)


    if request.method == 'POST':
        data = request.data

        required = ['type', 'station_id', 'rate', 'overtime_rate', 'capacity', 'quantity']
        for field in required:
            if data.get(field) is None:
                return Response({'error': f'{field} is required.'}, status=400)

        try:
            station = RentalStation.objects.get(id=data['station_id'], operator=request.user)
        except RentalStation.DoesNotExist:
            return Response({'error': 'Station not found.'}, status=404)

        qty = max(1, int(data['quantity']))
        created = []

        for _ in range(qty):
            v = RentableVehicle.objects.create(
                type=data['type'],
                rate=data['rate'],
                overtime_rate=data['overtime_rate'],
                capacity=data['capacity'],
                station=station,
                location=station.location, 
                operator=request.user,
            )
            created.append(v.id)

        return Response({'created': len(created), 'ids': created}, status=201)
    
    if request.method == 'DELETE':
        vehicle_id = request.query_params.get('id')
        if not vehicle_id:
            return Response({'error': 'id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            vehicle = RentableVehicle.objects.get(pk=vehicle_id, operator=request.user)
        except RentableVehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found.'}, status=status.HTTP_404_NOT_FOUND)
        if vehicle.status == RentableVehicle.vehicleStatus.RENTEDOUT:
            return Response({'error': 'Cannot delete a vehicle that is currently rented out.'}, status=status.HTTP_400_BAD_REQUEST)
        vehicle.delete()
        return Response({'message': f'Vehicle #{vehicle_id} deleted successfully.'})

# GET /api/rentals/op/rentals/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def operator_rentals(request):
    rentals = Rental.objects.filter(
        vehicle__operator=request.user
    ).select_related('vehicle', 'vehicle__location', 'user', 'payment').order_by('-created_at')

    data = [
        {
            'id': r.id,
            'status': r.status,
            'start_date_time': r.start_date_time,
            'end_date_time': r.end_date_time,
            'user': r.user.email,
            'payment': {
                'total': float(r.payment.total),
                'status': r.payment.status,
            } if r.payment else None,
            'vehicle': {
                'id': r.vehicle.id,
                'type': r.vehicle.type,
                'rate': float(r.vehicle.rate),
            },
        }
        for r in rentals
    ]

    return Response(data)