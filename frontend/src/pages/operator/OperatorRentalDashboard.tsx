import VehicleCard from "@/components/vehicles/VehicleCard";
import { type RentalVehicle, type VehicleType } from "@/models/vehicle";
import { useEffect, useState } from "react";
import { ApiClient } from "@/utils/ApiClient";
import { Button } from "@/components/ui/button";
import OperatorVehicleCard from "@/components/OperatorVehicleCard";
import VehicleDetailModal from "@/components/VehicleDetailModal";
import AddVehicleDrawer from "@/components/AddVehicleDrawer";

export default async function operatorRentalDashboard(){

    const [loading, setLoading] = useState<boolean>(true);
    const [stationView, setStationView] = useState<boolean>(false);
    const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
    const [bikes, setBikes] = useState<RentalVehicle[]>([]);
    const [cars, setCars] = useState<RentalVehicle[]>([]);
    const [scooters, setScooters] = useState<RentalVehicle[]>([]);
    const [rentalClientNames,setRentalClientNames] = useState<Record<number, string>>({});
    const [selectedVehicle,setSelectedVehicle] = useState<RentalVehicle | null>(null);

    
   
    useEffect(() => {
        ApiClient.getInstance().get("api/rentals/op/vehicles/")
        .then((data) => {
            const v = data as RentalVehicle[];
            setVehicles(v);
            setBikes(vehicles.filter((vehicle)=>(vehicle.type === "bike")));
            setCars(vehicles.filter((vehicle)=>(vehicle.type === "car")));
            setScooters(scooters.filter((vehicle)=>(vehicle.type === "escooter")));
            setLoading(false);
            const names: Record<number, string> = {};
            vehicles.filter((vehicle) => 
               !!vehicle.rental 
            ).forEach( async (vehicle) => {
                names[vehicle.id] = await getClientNameFor(vehicle.rental.id);
            })
        })
    });
   


    const getClientNameFor = async (rentalId: number) => {
        try{
            //important we fetch the user's name though the rental, because rental endpoints can verify that the operator and user share a rental thus is it safe to show some of the users info to this operator.
            const data = await ApiClient.getInstance().get(`/api/rentals/id=${rentalId}/op/user`) as any;
            return data?.name;
        } catch{
            return "error fecthing client info";
        }
    }

    return(
        <>
        <div>
            <div className="flex justify-between">
                <h1 className="text-2xl"> Your vehicles registered for rent</h1>
                <Button>seperate by station</Button>
            </div>
            
            <div>
                <h1 className="text-xl"> Bikes</h1> 
                <ul>
                    {bikes.map((bike) =>(
                        <OperatorVehicleCard vehicle={bike} clientName={rentalClientNames[bike.rental.id]}/>
                    ))}
                </ul>
            </div>

            <div>
                <h1 className="text-xl"> Cars</h1> 
                <ul>
                    {cars.map((car) =>(
                        <OperatorVehicleCard vehicle={car} clientName={rentalClientNames[car.rental.id]}/>
                    ))}
                </ul>
            </div>
            <div>
                <h1 className="text-xl"> E-Scooters</h1> 
                <ul>
                    {scooters.map((scooter) =>(
                        <OperatorVehicleCard vehicle={scooter} clientName={rentalClientNames[scooter.rental.id]}/>
                    ))}
                </ul>
            </div>   
        </div>

           

        </>
    )
} 
/*<AddVehicleDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        stations={stations}          // pass your RentalStation[] here
        onVehiclesAdded={(newVehicles) => {
            // POST to your API, then refresh the list
        }}
        /> 

        <VehicleDetailModal
        open={!!selectedVehicle}
        onOpenChange={(v) => { if (!v) setSelectedVehicle(null); }}
        vehicle={selectedVehicle}
        clientName={rentalClientNames[selectedVehicle.rental.id]}
        /> */  