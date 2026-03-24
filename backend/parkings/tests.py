from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from core.models import Location
from parkings.models import ParkingSpot, ParkingReservation


class ParkingApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.user = get_user_model().objects.create_user(
			username='customer1',
			email='customer1@example.com',
			password='password123',
			role='customer',
			name='Customer One',
		)
		location = Location.objects.create(
			address='Downtown Lot A',
			x=45.5017,
			y=-73.5673,
		)
		self.spot = ParkingSpot.objects.create(
			rate=12.50,
			location=location,
			is_available=True,
		)
		other_location = Location.objects.create(
			address='Downtown Lot B',
			x=45.5039,
			y=-73.5688,
		)
		self.other_spot = ParkingSpot.objects.create(
			rate=14.00,
			location=other_location,
			is_available=True,
		)
		self.other_user = get_user_model().objects.create_user(
			username='customer2',
			email='customer2@example.com',
			password='password123',
			role='customer',
			name='Customer Two',
		)

	def test_get_parking_spots(self):
		response = self.client.get('/api/parking/')
		self.assertEqual(response.status_code, 200)
		self.assertIn('spots', response.data)
		self.assertGreaterEqual(len(response.data['spots']), 1)

		created_spot = next(
			(spot for spot in response.data['spots'] if spot['id'] == self.spot.id),
			None,
		)
		self.assertIsNotNone(created_spot)
		self.assertTrue(created_spot['is_available'])
		self.assertIn('is_reserved_by_me', created_spot)

	def test_reserve_then_block_double_reserve(self):
		reserve_payload = {
			'parking_spot_id': self.spot.id,
			'user_id': self.user.id,
			'duration_minutes': 60,
		}

		first = self.client.post('/api/parking/reserve/', reserve_payload, format='json')
		self.assertEqual(first.status_code, 201)

		second = self.client.post('/api/parking/reserve/', reserve_payload, format='json')
		self.assertEqual(second.status_code, 409)

	def test_future_reservation_window_conflict(self):
		future_start = (timezone.now() + timedelta(hours=2)).isoformat()

		first = self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.spot.id,
				'user_id': self.user.id,
				'duration_minutes': 60,
				'start_at': future_start,
			},
			format='json',
		)
		self.assertEqual(first.status_code, 201)

		second = self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.spot.id,
				'user_id': self.user.id,
				'duration_minutes': 30,
				'start_at': future_start,
			},
			format='json',
		)
		self.assertEqual(second.status_code, 409)

	def test_get_parking_spots_marks_reservation_owner(self):
		self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.spot.id,
				'user_id': self.user.id,
				'duration_minutes': 60,
			},
			format='json',
		)
		self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.other_spot.id,
				'user_id': self.other_user.id,
				'duration_minutes': 60,
			},
			format='json',
		)

		self.client.force_authenticate(user=self.user)
		response = self.client.get('/api/parking/')
		self.assertEqual(response.status_code, 200)

		my_spot = next(spot for spot in response.data['spots'] if spot['id'] == self.spot.id)
		other_spot = next(spot for spot in response.data['spots'] if spot['id'] == self.other_spot.id)

		self.assertTrue(my_spot['is_reserved_by_me'])
		self.assertFalse(other_spot['is_reserved_by_me'])

	def test_user_cannot_hold_multiple_reservations(self):
		first = self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.spot.id,
				'user_id': self.user.id,
				'duration_minutes': 60,
			},
			format='json',
		)
		self.assertEqual(first.status_code, 201)

		second = self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.other_spot.id,
				'user_id': self.user.id,
				'duration_minutes': 30,
			},
			format='json',
		)
		self.assertEqual(second.status_code, 409)
		self.assertIn('error', second.data)

	def test_release_reservation_frees_spot(self):
		created = self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.spot.id,
				'user_id': self.user.id,
				'duration_minutes': 60,
			},
			format='json',
		)
		self.assertEqual(created.status_code, 201)

		release = self.client.post(
			'/api/parking/release/',
			{
				'reservation_id': created.data['reservation_id'],
				'user_id': self.user.id,
			},
			format='json',
		)
		self.assertEqual(release.status_code, 200)

		self.spot.refresh_from_db()
		self.assertTrue(self.spot.is_available)
		self.assertIsNone(self.spot.reserved_until)

	def test_legacy_null_end_at_still_blocks_new_reservation(self):
		legacy_reservation = ParkingReservation.objects.create(
			user=self.user,
			parking_spot=self.spot,
			duration_minutes=60,
			start_at=timezone.now(),
		)
		legacy_reservation.end_at = None
		legacy_reservation.save(update_fields=['end_at'])
		self.spot.is_available = False
		self.spot.reserved_until = timezone.now() + timedelta(minutes=30)
		self.spot.save(update_fields=['is_available', 'reserved_until'])

		response = self.client.post(
			'/api/parking/reserve/',
			{
				'parking_spot_id': self.other_spot.id,
				'user_id': self.user.id,
				'duration_minutes': 30,
			},
			format='json',
		)
		self.assertEqual(response.status_code, 409)
