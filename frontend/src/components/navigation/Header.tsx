import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

import favicon from "/appicon.svg"
import { Button } from "../ui/button"
import { logout } from "@/services/authService";

export default function Header() {
    const navigate = useNavigate();
    const {user} = useAuth();


    const handleLogin = () => {
        navigate("/login")
    }

    const handleLogout = () => {
        logout();
    }

    return (
        <div className="flex justify-between w-full border-2 rounded-lg sticky top-0">
            <div className="flex justify-between gap-x-5">
                <div className="flex flex-row justify-between align-bottom">
                    <Link to={"/"}>
                        <img src={favicon} alt="SUMMS Logo"/>
                    </Link>
                    <h1 className="text-primary">SUMMS</h1>
                </div>
                <NavigationMenu className="relative w-full">
                    <NavigationMenuList className="flex justify-between">
                        <NavigationMenuItem >
                            <NavigationMenuTrigger>
                                <Link to={"/rent"}>
                                    Rent A vehicle
                                </Link>
                                </NavigationMenuTrigger>
                            <NavigationMenuContent className="flex flex-row justify-between min-w-md">
                                <NavigationMenuLink asChild>
                                    <Link to={"/rent-bike"}>
                                    Bikes
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link to={"/rent-escooter"}>
                                    E-Scooters
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link to={"/rent-car"}>
                                    Cars
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>
                                <Link to={"/startTrip"}>
                                    Start a trip
                                </Link>
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="flex flex-row justify-between min-w-md">
                                <NavigationMenuLink>placeholder</NavigationMenuLink>
                                <NavigationMenuLink>placeholder 2</NavigationMenuLink>
                                <NavigationMenuLink>placeholder 3</NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link className="hover:bg-accent rounded-lg p-2" to={"/parking"}>Reserve a Parking spot</Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Analytics</NavigationMenuTrigger>
                            <NavigationMenuContent className="flex flex-row min-w-md">
                                <NavigationMenuLink asChild>
                                    <Link to={"/admin-overview"}>
                                    Admin Overview
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link to={"/admin-cities"}>
                                    Admin Cities
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                    </NavigationMenuItem>
                    {user ? 
                    <Button className="bg-background text-foreground rounded-lg" onClick={handleLogout}>
                        Logout
                    </Button>
                    :
                    <Button className="bg-background text-foreground rounded-lg" onClick={handleLogin}>
                        Login
                    </Button>
                    }  
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}