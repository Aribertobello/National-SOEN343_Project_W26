from django.urls import path

from parkings.views import ParkingListView, ParkingReserveView, ParkingReleaseView

urlpatterns = [
    path('', ParkingListView.as_view(), name='parking-list'),
    path('reserve/', ParkingReserveView.as_view(), name='parking-reserve'),
    path('release/', ParkingReleaseView.as_view(), name='parking-release'),
]
