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
import BookingPage    from "@/pages/BookingPage";
import MyRentalsPage  from "@/pages/MyRentalsPage";

import { BikeFactory, CarFactory, EScooterFactory } from "@/utils/factories";

const bikeConfig     = new BikeFactory().createConfig();
const carConfig      = new CarFactory().createConfig();
const escooterConfig = new EScooterFactory().createConfig();


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <RouteError />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "/404",
                element: <NotFound />
            },
            {
                path: "rent",
                element: <RentPage />
            },
            {
                path: "rent-bike",
                element: <RentBikePage />
            },
            {
                path: "rent-escooter",
                element: <RentEScooterPage />
            },
            {
                path: "rent-car",
                element: <RentCarPage />
            },
            {   path: "rent-bike/:id",
                element: <BookingPage config={bikeConfig} />
            },
            {   path: "rent-escooter/:id",
                element: <BookingPage config={escooterConfig} />
            },
            {   path: "rent-car/:id",
                element: <BookingPage config={carConfig} />
            },
            {   path: "my-rentals",
                element: <MyRentalsPage />
            },
            {   path: "*",
                element: <NotFound />
            },
        ]
    },
    authRouter
]);
export default router;
