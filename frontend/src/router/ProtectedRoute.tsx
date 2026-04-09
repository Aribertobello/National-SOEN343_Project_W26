import { Navigate } from "react-router-dom";
import NoAccess from "./NoAccess"
import { type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Role } from "@/models/user";
import { Spinner } from "@/components/ui/spinner";

interface protectedRouteProps {
    children: ReactNode;
    role: Role;
    fallbackRoute?: string;
    errorMessage?: string;
}   

export default function ProtectedRoute(
    {children, role, fallbackRoute, errorMessage="You do not have acess to this page"}
    :protectedRouteProps){

    const {loading} = useAuth();
    const {user} = useAuth();

    
    if (loading){
        return <Spinner className="w-50 h-50"></Spinner>
    } else if (role === user?.role){
        return  children;
    } 
    return fallbackRoute ? <Navigate to={fallbackRoute} replace/> : <NoAccess description={errorMessage}/>;
}