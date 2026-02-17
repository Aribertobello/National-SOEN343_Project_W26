import App from "@/App";
import NotFound from "./NotFound";
import {createBrowserRouter} from "react-router-dom";
import RouteError from "./RouteError";
import Home from "@/components/Home";



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
        ]
    },
]);
export default router;
