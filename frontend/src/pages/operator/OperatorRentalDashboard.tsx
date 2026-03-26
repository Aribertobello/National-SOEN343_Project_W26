//import VehicleCard from "@/components/vehicles/VehicleCard";
import { type RentalVehicle, type VehicleType } from "@/models/vehicle";
import { type RentalStation } from "@/models/RentalStation";
import { useEffect, useState } from "react";
import { ApiClient } from "@/utils/ApiClient";
import { Button } from "@/components/ui/button";
import OperatorVehicleCard from "@/components/OperatorVehicleCard";
//import VehicleDetailModal from "@/components/VehicleDetailModal";
import AddVehicleDrawer from "@/components/OperatorFormDrawer";

export default function operatorRentalDashboard(){

    const [loading, setLoading] = useState<boolean>(true);
    const [stationView, setStationView] = useState<boolean>(false);
    const [stations, setStations] = useState<RentalStation[]>([]);
    const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
    const [bikes, setBikes] = useState<RentalVehicle[]>([]);
    const [cars, setCars] = useState<RentalVehicle[]>([]);
    const [scooters, setScooters] = useState<RentalVehicle[]>([]);
    const [rentalClientNames,setRentalClientNames] = useState<Record<number, string>>({});
    const [selectedVehicle,setSelectedVehicle] = useState<RentalVehicle | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    


    
   
    useEffect(() => {
        ApiClient.getInstance().get("/api/rentals/op/vehicles/")
        .then((data) => {
            //TODO use adapter pattern to change payload to front end models
            const v = data as RentalVehicle[];
            setVehicles(v);
            console.log(v);
            setBikes(v.filter((vehicle)=>(vehicle.type == "bike")));
            console.log(bikes);
            setCars(v.filter((vehicle)=>(vehicle.type === "car")));
            setScooters(v.filter((vehicle)=>(vehicle.type === "escooter")));
            setLoading(false);
            const names: Record<number, string> = {};
            v.filter((vehicle) => 
               !!vehicle.rental 
            ).forEach( async (vehicle) => {
                names[vehicle.id] = await getClientNameFor(vehicle.rental.id);
            })
        })
    },[]);

    useEffect(() => {
        ApiClient.getInstance().get("api/rentals/op/stations/")
        .then((data) => {

            const s = data as RentalStation[];
            setStations(s);
        })
    },[]);
   

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
        <div className="p-10 min-w-[80%] space-y-5">
            <div className="text-3xl font-bold tracking-tight">Rental Vehicles</div>
            <div className="flex justify-between">
                <h1 className="text-muted-foreground"> Your vehicles registered for rent</h1>
                <Button>seperate by station</Button>
            </div>
            
            <div className="sapc-y-2">
                <h1 className="text-xl"> Bikes</h1>
                 <hr className="py-2"/>
                <ul>
                    <div className="flex flex-col space-y-4">
                        {bikes.length !== 0 ? (
                            bikes.map((bike) =>(
                            <OperatorVehicleCard vehicle={bike} 
                            clientName={bike.rental ? rentalClientNames[bike.rental.id]: "N/A"}/>
                        ))):
                        <span className="text-muted-foreground">
                            You have no bikes up for rental at the moment    
                        </span>}
                        <Button className="max-w-[40%]" onClick={() => setDrawerOpen(true)}>
                            put a bike up for rental
                        </Button>
                    </div>
                    
                </ul>
            </div>

            <div className="spac-y-2">
                <h1 className="text-xl"> Cars</h1>
                 <hr className="py-2"/>
                <ul>
                    <div className="flex flex-col space-y-4">
                        {cars.length !== 0 ? (
                        cars.map((car) =>(
                        <OperatorVehicleCard vehicle={car} 
                            clientName={car.rental ? rentalClientNames[car.rental.id]: "N/A"}/>
                        ))):
                        <span className="text-muted-foreground">
                            You have no cars up for rental at the moment    
                        </span>}
                        <Button className="max-w-[40%]" onClick={() => setDrawerOpen(true)}>
                            put a car up for rental
                        </Button>
                    </div>
                </ul>
            </div>
            <div className="spac-y-2">
                <h1 className="text-xl"> E-Scooters</h1> 
                <hr className="py-2"/>
                <ul>
                    <div className="flex flex-col space-y-4">
                        {scooters.length !== 0 ? (
                        scooters.map((scooter) =>(
                        <div className="hover:bg-muted cursor-pointer">
                            <OperatorVehicleCard vehicle={scooter} 
                            clientName={scooter.rental ? rentalClientNames[scooter.rental.id] : "N/A"}/>
                        </div>
                    ))):
                    <span className="text-muted-foreground">
                        You have no scooters up for rental at the moment    
                    </span>}
                        <Button className="max-w-[40%]" onClick={() => setDrawerOpen(true)}>
                            put an E-Scooter up for rental
                        </Button>
                    </div>
                </ul>
            </div>   
        </div>

        <AddVehicleDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        /> 
        </>
    );
} 

/*

        <VehicleDetailModal
        open={!!selectedVehicle}
        onOpenChange={(v) => { if (!v) setSelectedVehicle(null); }}
        vehicle={selectedVehicle}
        clientName={rentalClientNames[selectedVehicle.rental.id]}
        /> */  