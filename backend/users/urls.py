from django.urls import path
from .views import SignupView
from dj_rest_auth.views import LoginView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
]