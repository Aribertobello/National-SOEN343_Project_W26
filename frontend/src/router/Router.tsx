import App from "@/App";
import NotFound from "./NotFound";
import {createBrowserRouter} from "react-router-dom";
import RouteError from "./RouteError";
import Home from "@/components/Home";
import RentPage from "@/pages/RentPage";
import RentBikePage from "@/pages/RentBikePage";
import RentEScooterPage from "@/pages/RentEScooterPage";
import RentCarPage from "@/pages/RentCarPage";


const router = createBrowserRouter([
    {
        path:"/",
        element:<App/>,
        errorElement:<RouteError/>,
        children:[
            {
                index:true,
                element:<Home/>
            },
            {
                path:"/404",
                element:<NotFound/>
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
        ]
    },
]);
export default router;
