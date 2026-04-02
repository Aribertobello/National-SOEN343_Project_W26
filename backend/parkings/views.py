from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from parkings.models import ParkingReservation, ParkingSpot


def refresh_parking_spot_availability(spot: ParkingSpot, now=None) -> bool:
	current_time = now or timezone.now()
	if spot.is_available:
		return False

	if spot.reserved_until and spot.reserved_until <= current_time:
		spot.is_available = True
		spot.reserved_until = None
		spot.save(update_fields=["is_available", "reserved_until"])
		return True

	return False


class ParkingListView(APIView):
	def get(self, request):
		now = timezone.now()
		current_user_id = request.user.id if request.user.is_authenticated else None
		spots = ParkingSpot.objects.select_related("location").order_by("id")

		payload = []
		for spot in spots:
			refresh_parking_spot_availability(spot, now=now)

			active_reservation = ParkingReservation.objects.filter(
				parking_spot=spot,
				start_at__isnull=False,
				end_at__isnull=False,
				start_at__lte=now,
				end_at__gt=now,
			).order_by("-created_at").first()

			if active_reservation is None and (not spot.is_available) and spot.reserved_until and spot.reserved_until > now:
				active_reservation = ParkingReservation.objects.filter(parking_spot=spot).order_by("-created_at").first()

			is_reserved_by_me = bool(
				current_user_id and active_reservation and active_reservation.user_id == current_user_id
			)

			payload.append({
				"id": spot.id,
				"location": spot.location.address,
				"latitude": float(spot.location.x),
				"longitude": float(spot.location.y),
				"rate": float(spot.rate),
				"is_available": spot.is_available,
				"reserved_until": spot.reserved_until.isoformat() if spot.reserved_until else None,
				"is_reserved_by_me": is_reserved_by_me,
				"my_reservation_id": active_reservation.id if is_reserved_by_me else None,
			})

		return Response({"spots": payload}, status=status.HTTP_200_OK)


class ParkingReserveView(APIView):
	def post(self, request):
		spot_id = request.data.get("parking_spot_id")
		duration_minutes = request.data.get("duration_minutes", 60)
		start_at_raw = request.data.get("start_at")

		try:
			duration_minutes = int(duration_minutes)
		except (TypeError, ValueError):
			return Response(
				{"error": "duration_minutes must be a positive integer."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if duration_minutes <= 0:
			return Response(
				{"error": "duration_minutes must be a positive integer."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		now = timezone.now()
		if start_at_raw:
			start_at = parse_datetime(start_at_raw)
			if start_at is None:
				return Response(
					{"error": "start_at must be a valid ISO datetime."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			if timezone.is_naive(start_at):
				start_at = timezone.make_aware(start_at, timezone.get_current_timezone())
			if start_at < now:
				return Response(
					{"error": "start_at must be now or in the future."},
					status=status.HTTP_400_BAD_REQUEST,
				)
		else:
			start_at = now

		end_at = start_at + timedelta(minutes=duration_minutes)

		user = request.user if request.user.is_authenticated else None
		if user is None:
			user_id = request.data.get("user_id")
			if user_id is None:
				return Response(
					{"error": "user_id is required when unauthenticated."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			User = get_user_model()
			user = User.objects.filter(id=user_id).first()
			if user is None:
				return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

		existing_user_reservation = ParkingReservation.objects.filter(
			user=user,
		).filter(
			Q(end_at__isnull=False, end_at__gt=now)
			|
			Q(end_at__isnull=True, parking_spot__reserved_until__isnull=False, parking_spot__reserved_until__gt=now)
		).order_by("start_at", "created_at").first()
		if existing_user_reservation:
			reserved_until = existing_user_reservation.end_at
			if reserved_until is None:
				reserved_until = existing_user_reservation.parking_spot.reserved_until
			return Response(
				{
					"error": "You already have an active or upcoming parking reservation.",
					"reservation_id": existing_user_reservation.id,
					"reserved_until": reserved_until.isoformat() if reserved_until else None,
				},
				status=status.HTTP_409_CONFLICT,
			)

		with transaction.atomic():
			spot = ParkingSpot.objects.select_related("location").select_for_update().filter(id=spot_id).first()
			if spot is None:
				return Response({"error": "Parking spot not found."}, status=status.HTTP_404_NOT_FOUND)

			refresh_parking_spot_availability(spot, now=now)

			overlap = ParkingReservation.objects.filter(
				parking_spot=spot,
				start_at__isnull=False,
				end_at__isnull=False,
				start_at__lt=end_at,
				end_at__gt=start_at,
			).order_by("end_at").first()

			if overlap:
				return Response(
					{
						"error": "Parking spot is not available for this time window.",
						"next_available_at": overlap.end_at.isoformat(),
					},
					status=status.HTTP_409_CONFLICT,
				)

			if start_at <= now:
				spot.is_available = False
				spot.reserved_until = end_at
				spot.save(update_fields=["is_available", "reserved_until"])

			reservation = ParkingReservation.objects.create(
				user=user,
				parking_spot=spot,
				duration_minutes=duration_minutes,
				start_at=start_at,
				end_at=end_at,
			)

			reservation_total = (Decimal(duration_minutes) / Decimal(60)) * spot.rate
			reservation.payment.total = reservation_total.quantize(Decimal("0.01"))
			reservation.payment.save(update_fields=["total"])

		return Response(
			{
				"reservation_id": reservation.id,
				"parking_spot_id": spot.id,
				"location": spot.location.address,
				"duration_minutes": duration_minutes,
				"start_at": start_at.isoformat(),
				"reserved_until": end_at.isoformat(),
				"end_at": end_at.isoformat(),
				"total": float(reservation.payment.total),
				"payment_status": reservation.payment.status,
			},
			status=status.HTTP_201_CREATED,
		)


class ParkingReleaseView(APIView):
	def post(self, request):
		now = timezone.now()
		reservation_id = request.data.get("reservation_id")
		spot_id = request.data.get("parking_spot_id")

		user = request.user if request.user.is_authenticated else None
		if user is None:
			user_id = request.data.get("user_id")
			if user_id is None:
				return Response(
					{"error": "user_id is required when unauthenticated."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			User = get_user_model()
			user = User.objects.filter(id=user_id).first()
			if user is None:
				return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

		with transaction.atomic():
			queryset = ParkingReservation.objects.select_related("parking_spot", "parking_spot__location").select_for_update().filter(user=user)

			if reservation_id is not None:
				reservation = queryset.filter(id=reservation_id).first()
			elif spot_id is not None:
				reservation = queryset.filter(parking_spot_id=spot_id).order_by("-created_at").first()
			else:
				return Response(
					{"error": "reservation_id or parking_spot_id is required."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			if reservation is None:
				return Response({"error": "Reservation not found."}, status=status.HTTP_404_NOT_FOUND)

			if reservation.end_at and reservation.end_at <= now:
				return Response(
					{"error": "Reservation is already expired."},
					status=status.HTTP_409_CONFLICT,
				)

			reservation.end_at = now
			reservation.save(update_fields=["end_at"])

			spot = reservation.parking_spot
			spot.is_available = True
			spot.reserved_until = None
			spot.save(update_fields=["is_available", "reserved_until"])

		return Response(
			{
				"message": "Reservation released.",
				"reservation_id": reservation.id,
				"parking_spot_id": reservation.parking_spot_id,
				"released_at": now.isoformat(),
			},
			status=status.HTTP_200_OK,
		)
