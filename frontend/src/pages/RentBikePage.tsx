import VehicleListPage from "@/components/vehicles/VehicleListPage";
import { BikeFactory } from "@/utils/factories";

const bikeConfig = new BikeFactory().createConfig();

export default function RentBikePage() {
  return <VehicleListPage config={bikeConfig} />;
}
