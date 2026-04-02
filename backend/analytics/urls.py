from django.urls import path
from . import views

urlpatterns = [
    path("", views.analytics_dashboard, name="analytics-dashboard"),
    path("system/", views.system_analytics, name="analytics-system"),
]