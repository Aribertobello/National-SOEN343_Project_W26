import { type VehicleType } from "./vehicle";
import { type Location } from "./location";

export interface RentalStation{
    id: number,
    name: string,
    type: VehicleType
    location: Location
} 