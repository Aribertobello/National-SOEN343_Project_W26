import VehicleListPage from "@/components/vehicles/VehicleListPage";
import { CarFactory } from "@/utils/factories";

const carConfig = new CarFactory().createConfig();

export default function RentCarPage() {
  return <VehicleListPage config={carConfig} />;
}
