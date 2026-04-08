import App from "@/App";
import NotFound from "./NotFound";
import { createBrowserRouter } from "react-router-dom";
import RouteError from "./RouteError";
import Home from "@/components/Home";
import RentPage from "@/pages/RentPage";
import RentBikePage from "@/pages/RentBikePage";
import RentEScooterPage from "@/pages/RentEScooterPage";
import RentCarPage from "@/pages/RentCarPage";
import authRouter from "./AuthRouter";
import BookingPage from "@/pages/BookingPage";
import MyRentalsPage from "@/pages/MyRentalsPage";
import OperatorRentalDashboard from "@/pages/operator/OperatorRentalDashboard";
import ParkingPage from "@/pages/ParkingPage";
import AdminOverview from "@/pages/Analytics/AdminOverview";
import AdminCities from "@/pages/Analytics/AdminCities";
import StartTripPage from "../pages/StartTripPage";

import { BikeFactory, CarFactory, EScooterFactory } from "@/utils/factories";
import ProtectedRoute from "./ProtectedRoute";
import { Role } from "@/models/user";

const bikeConfig = new BikeFactory().createConfig();
const carConfig = new CarFactory().createConfig();
const escooterConfig = new EScooterFactory().createConfig();

import AnalyticsDashboard from "../pages/Analytics/AnalyticsDashboard";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/404",
        element: <NotFound />,
      },
      {
        path: "rent",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <RentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "rent-bike",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <RentBikePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "rent-escooter",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <RentEScooterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "rent-car",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <RentCarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "rent-bike/:id",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <BookingPage config={bikeConfig} />
          </ProtectedRoute>
        ),
      },
      {
        path: "rent-escooter/:id",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <BookingPage config={escooterConfig} />
          </ProtectedRoute>
        ),
      },
      {
        path: "rent-car/:id",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <BookingPage config={carConfig} />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-rentals",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <MyRentalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "parking",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <ParkingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "startTrip",
        element: (
          <ProtectedRoute role={Role.CUSTOMER}>
            <StartTripPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "op/",
        element: (
          <ProtectedRoute role={Role.OPERATOR}>
            <OperatorRentalDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin-overview",
        element: (
          <ProtectedRoute role={Role.ADMIN}>
            <AdminOverview />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin-cities",
        element: (
          <ProtectedRoute role={Role.ADMIN}>
            <AdminCities />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
      {
        path: "analytics",
        element: (
          <ProtectedRoute role={Role.OPERATOR}>
            <AnalyticsDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  authRouter,
]);
export default router;
