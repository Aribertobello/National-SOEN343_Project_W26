import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import favicon from "/appicon.svg"
import { Button } from "../ui/button"

export default () => {
    return (
        <div className="flex justify-between w-full border rounded-lg sticky top-0">
            <div className="flex justify-between gap-x-5">
                <div className="flex flex-row justify-between align-bottom">
                    <img src={favicon} alt="SUMMS Logo"/>
                    <h1 className="text-primary">SUMMS</h1> 
                </div>
                <NavigationMenu>
                    <NavigationMenuList className="flex justify-between">
                        <NavigationMenuItem >
                            <NavigationMenuTrigger>Rent A vehicle</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink>Bikes</NavigationMenuLink>
                                <NavigationMenuLink>E-Scooters</NavigationMenuLink>
                                <NavigationMenuLink>Cars</NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>start a trip</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink>Bikes</NavigationMenuLink>
                                <NavigationMenuLink>E-Scooters</NavigationMenuLink>
                                <NavigationMenuLink>Cars</NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Reserve a Parking spot</NavigationMenuTrigger>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Analytics</NavigationMenuTrigger>
                    </NavigationMenuItem>
                    <Button className="bg-background text-foreground rounded-lg">
                        Login
                    </Button>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}