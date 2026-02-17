# Backend - Django REST API

Django REST API for the Smart Urban Mobility Management System (SUMMS).

## Prerequisites
You need Docker installed on your machine to run the backend.

### Installing Docker Desktop
Follow the official installation guides for your system:
- **Windows (with WSL2):** [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)  
- **macOS:** [Install Docker Desktop on Mac](https://docs.docker.com/desktop/setup/install/mac-install/)  
- **Linux (Ubuntu/Debian):** [Install Docker Engine on Linux](https://docs.docker.com/engine/install/ubuntu/)  

### Verify Installation
After installation, check that Docker is working:
```bash
docker --version
docker compose version
```

**IMPORTANT:** Before running any Docker commands, make sure Docker Desktop is running.

## Docker Configuration
- **Backend Service**: Django app running on port 8000
- **Database**: PostgreSQL 16 container on port 5434
- **Volume Mounts**: Code directory for live reload during development

## Django Apps

- **users**: User authentication, registration, and profile management
- **rentals**: Vehicle rental lifecycle (search, reservation, payment, return)
- **parkings**: Parking space management and services  
- **analytics**: Rental metrics, gateway analytics, and reporting

## Local Development

### First Time Setup
```bash
# Build and start containers (first time will download images and build)
docker-compose up -d --build

# Wait about 10 seconds for database to initialize, then run migrations
docker-compose exec backend python manage.py migrate

# (Optional) Create a superuser for admin access
docker-compose exec backend python manage.py createsuperuser
```

After setup, the API will be available at `http://localhost:8000`  
Django admin panel: `http://localhost:8000/admin`

### Daily Development

#### Starting the Application
```bash
# Start all services (Django + PostgreSQL)
docker-compose up

# Or run in background (detached mode)
docker-compose up -d

# Stop services (or press Ctrl+C if running in foreground)
docker-compose down
```

## Common Commands

All commands should be run through Docker:

### Run Migrations

```bash
docker-compose exec backend python manage.py migrate
```

### Create a New Django App

```bash
docker-compose exec backend python manage.py startapp <app_name>
```

### Make Migrations

```bash
# Create migration files after changing models
# Run this whenever you modify models.py files
docker-compose exec backend python manage.py makemigrations
```

### Run Django Shell

```bash
# Interactive Python shell with Django loaded
# Useful for testing queries, creating test data
docker-compose exec backend python manage.py shell
```

### Run Tests

```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run tests for specific app
docker-compose exec backend python manage.py test rentals
```

### View Logs

```bash
# Follow logs in real-time
docker-compose logs -f backend

# View last 50 lines
docker-compose logs --tail=50 backend
```

### Restart Services

```bash
# Restart just the backend service (after dependency changes)
docker-compose restart backend

# Rebuild after changing requirements.txt
docker-compose up -d --build backend
```

### Stop the Backend

```bash
docker-compose down
```

## Project Structure

```
backend/
├── config/           # Django project settings
│   ├── settings.py   # Main settings (PostgreSQL configured)
│   ├── urls.py       # Root URL configuration
│   └── wsgi.py       # WSGI application
├── users/            # User authentication & profiles
├── rentals/          # Vehicle rental system
├── parkings/         # Parking services
├── analytics/        # System analytics
├── manage.py         # Django management script
├── requirements.txt  # Python dependencies
├── Dockerfile        # Docker configuration
└── .dockerignore     # Docker ignore file
```

## Development Notes

- The backend runs on port **8000**
- PostgreSQL database on port **5434** (to avoid conflicts with local PostgreSQL)
- CORS is configured to allow requests from `http://localhost:5173` (Vite frontend)
- Django REST Framework is pre-configured for API development
- Hot-reloading is enabled via volume mounting
- Database credentials are in `docker-compose.yml` (change for production)

## API Documentation

Once running, you can access:
- Admin panel: http://localhost:8000/admin
- API endpoints: Configure in each app's `urls.py`
- API schema: Add DRF browsable API or Swagger/ReDoc later
