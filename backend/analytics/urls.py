from django.urls import path
from .views import AdminOverviewView, AdminCitiesView

urlpatterns = [
    path("overview/", AdminOverviewView.as_view(), name="overview"),
    path("cities/", AdminCitiesView.as_view(), name="cities"),
]