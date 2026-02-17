# Frontend - SUMMS Platform

React frontend for the Smart Urban Mobility Management System (SUMMS).

## Prerequisites
- **Node.js**: 18.x, 20.x, or 22.x LTS ([Download here](https://nodejs.org/en/download))
- **npm**: 9.x or 10.x (comes with Node.js)

Verify installation: `node --version` and `npm --version`

## Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Development
- **`npm run dev`**: Development server with hot reload (Vite)
- **`npm run build`**: Build for production
- **`npm run preview`**: Preview production build
- **`npm run lint`**: Check code quality with ESLint

## Project Structure
```
src/
├── components/  # UI components (.js/.jsx + css)
├── pages/       # Page components (.js/.jsx + css)
├── models/      # Data types (.ts)
├── services/    # API calls (.ts)
├── utils/       # Helper functions (.ts)
├── styles/      # Global CSS files
└── App.tsx      # Main component
```

## Coding Style

### React & TypeScript Conventions
- **Components**: Use functional components with React Hooks
- **TypeScript**: 
  - Use TypeScript for all components and logic
  - Define interfaces for all props and API responses
  - Leverage type safety for better developer experience
- **Naming**:
  - Components: PascalCase (e.g., `VehicleCard`, `RentalForm`)
  - Files: Match component name (e.g., `VehicleCard.tsx`)
  - Variables/functions: camelCase (e.g., `fetchVehicles`, `isAvailable`)
- **State Management**: Use React Context API or hooks for state management
- **API Calls**: 
  - Define all API functions in separate service files
  - Use async/await syntax
  - Handle errors gracefully with try-catch blocks
- **Error Handling**: 
  - Use try-catch blocks for async operations
  - Display user-friendly error messages
- **Accessibility**: Include ARIA labels and semantic HTML elements

### Code Organization
- `components/`: Reusable UI components
- `router/`: Route-level page components and routing configuration
- `lib/`: Helper functions and utilities
- `assets/`: Static assets (images, icons)

## Tech Stack
- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework

## API Integration
- **Backend URL**: `http://localhost:8000/api/`
- CORS is pre-configured for local development
- Create service files in `src/services/` for API communication
