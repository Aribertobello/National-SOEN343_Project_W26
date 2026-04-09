import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

import favicon from "/appicon.svg";
import { Button } from "../ui/button";
import { logout } from "@/services/authService";
import { Role } from "@/models/user";

export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex justify-between w-full rounded-lg sticky top-0 z-10 bg-black">
      <div className="flex justify-between gap-x-5">
        <div className="flex flex-row justify-between align-bottom">
          <Link to="/">
            <img src={favicon} alt="SUMMS Logo" />
          </Link>
          <h1 className="text-primary">SUMMS</h1>
        </div>

        <NavigationMenu className="relative w-full">
          <NavigationMenuList className="flex justify-between">
            {user?.role === Role.ADMIN ? (
              <NavigationMenuItem>
                <NavigationMenuTrigger>Analytics</NavigationMenuTrigger>
                <NavigationMenuContent className="flex flex-col min-w-[220px] p-2 gap-1">
                  <NavigationMenuLink asChild>
                    <Link
                      className="hover:bg-accent rounded-lg p-2 text-sm"
                      to="/admin-overview"
                    >
                      Admin Overview
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      className="hover:bg-accent rounded-lg p-2 text-sm"
                      to="/admin-cities"
                    >
                      Admin Cities
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : user?.role === Role.OPERATOR ? (
              <NavigationMenuItem>
                <NavigationMenuTrigger>Analytics</NavigationMenuTrigger>
                <NavigationMenuContent className="flex flex-col min-w-[220px] p-2 gap-1">
                  <NavigationMenuLink asChild>
                    <Link
                      className="hover:bg-accent rounded-lg p-2 text-sm"
                      to="/analytics"
                    >
                      My Fleet Analytics
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link
                      className="hover:bg-accent rounded-lg p-2 text-sm"
                      to="/op"
                    >
                      Rental Dashboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : (
              <>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <Link to="/rent">Rent A vehicle</Link>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="flex flex-row justify-between min-w-md">
                    <NavigationMenuLink asChild>
                      <Link to="/rent-bike">Bikes</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/rent-escooter">E-Scooters</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/rent-car">Cars</Link>
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    className="hover:bg-accent rounded-lg p-2"
                    to="/startTrip"
                  >
                    Start a trip
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    className="hover:bg-accent rounded-lg p-2"
                    to="/parking"
                  >
                    Reserve a Parking spot
                  </Link>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <NavigationMenu>
        <NavigationMenuList>
          {user?.role === Role.CUSTOMER && (
            <NavigationMenuItem>
              <Link to="/my-rentals">My rentals</Link>
            </NavigationMenuItem>
          )}

          {user ? (
            <div className="flex justify-between">
              <Button
                className="bg-background text-foreground rounded-lg"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              className="bg-background text-foreground rounded-lg"
              onClick={handleLogin}
            >
              Login
            </Button>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
