from django.urls import path
from . import views
from .views import AdminOverviewView

urlpatterns = [
    path("overview/", AdminOverviewView.as_view(), name="overview"),
        path("", views.analytics_dashboard, name="analytics-dashboard"),
    path("system/", views.system_analytics, name="analytics-system"),
]