# National-SOEN343_Project_W26

## Team Members

| Name | Student ID |
|------|------------|
| Maximilian Grabowski | 40251210 |
| Anthony Painchaud | 40250169 |
| Curtis Moxebo | 40296254 |
| Ariberto Bello Veras | 40319600 |
| Dmitrii Cazacu | 40314501 |
| Romain Corbel | 40257534 |

## Objective
Develop the Smart Urban Mobility Management System (SUMMS) to coordinate and optimize multiple urban mobility services within a smart city environment. SUMMS aims to improve transportation efficiency, reduce congestion, and enhance the overall mobility experience for citizens by unifying shared mobility services, parking infrastructure, and public transportation into a single, intelligent management system.

- Integrate multiple urban mobility services into a unified platform.
- Enhance user experience by providing accessible and reliable mobility options.
- Support sustainable transportation by encouraging shared and public mobility.
- Provide city administrators with analytics and monitoring tools for informed planning.

## Project Summary
SUMMS (Smart Urban Mobility Management System) is a full-stack web application designed to coordinate and optimize urban mobility services. The system manages vehicle rentals, parking infrastructure, and provides analytics for city administrators to improve transportation efficiency and reduce congestion.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- Tailwind CSS for styling

### Backend
- Django 6.0
- Django REST Framework
- PostgreSQL database
- Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose (for backend)
- Node.js 18+ (for frontend)

### Running the Application

1. **Start the Backend** (runs in Docker):
   ```bash
   docker-compose up --build
   ```
   Backend will be available at `http://localhost:8000`

2. **Start the Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   └── README.md      # Frontend-specific documentation
│
├── backend/           # Django REST API
│   ├── config/        # Django project settings
│   ├── users/         # User authentication & profiles
│   ├── rentals/       # Vehicle rental system
│   ├── parkings/      # Parking services
│   ├── analytics/     # System analytics
│   └── README.md      # Backend-specific documentation
│
├── docker-compose.yml # Docker orchestration
└── README.md          # This file
```

## Development Workflow

- **Frontend**: See [frontend/README.md](frontend/README.md)
- **Backend**: See [backend/README.md](backend/README.md)

All backend commands run through Docker to eliminate Python version conflicts for the team.

## Project Features
  - User Account Creation
  - User Event Feed
  - User Personal Calendar
  - Student Ticket Wallet
  - Student Event Search Engine
  - Organizer Event Creation
  - Organizer QRcode Ticket Validation
  - Organizer attendance tracking
  - Organizer Event Dashboard Analytics
  - Organizer CSV attendance file export 
  - Admin Account Management
  - Admin Policy Enforcement
  - Admin Global Stats 
  
## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- React Router
- Tailwind CSS

### Backend
- Python 3.12
- Django 6.0
- Django REST Framework
- PostgreSQL 16
- Docker & Docker Compose

## For the User
  - You can be a student, organizer or administrator
  - As a student access to a personal calendar for events, personal wallet for tickets, a personal feed and a search engine
  - As an organizer you will have access to event creation/management, ticket verification tools, attendance tracking, and a dashboard for event analytics
  - As an administrator you will have manage accounts, assign roles, moderate events for compliance and have access to global event stats

 Context diagram:  https://drive.google.com/file/d/1aTpt1PR0V50_D-f3lbIg4z4Vza4AOS_l/view?usp=sharing 
