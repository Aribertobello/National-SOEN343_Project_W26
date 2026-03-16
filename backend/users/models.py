from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'CUSTOMER'
        OPERATOR = 'operator', 'OPERATOR'
        ADMIN = 'admin', 'ADMIN'

    last_updated = models.DateTimeField(auto_now = True)
    email = models.EmailField(unique = True)
    role = models.CharField(choices = Role,max_length = 20, default = Role.CUSTOMER)

    def __str__(self):
        return f"{self.first_name} {self.last_name}: {self.email}"