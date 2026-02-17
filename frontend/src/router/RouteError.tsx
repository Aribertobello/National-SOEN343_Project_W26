
import { useEffect } from "react";
import {useRouteError, useNavigate} from "react-router-dom";
import NotFound from "./NotFound";

interface routingError {
    status?: number 
}

export default function RouteError(){
    const err: routingError = useRouteError() as routingError;
    const navigate = useNavigate();
    if(!err) return;

    useEffect(() => {
        if(err.status == 404){
            navigate("/404");
        }
    });
    return <NotFound/>
}