import VehicleListPage from "@/components/vehicles/VehicleListPage";
import { EScooterFactory } from "@/utils/factories";

const escooterConfig = new EScooterFactory().createConfig();

export default function RentEScooterPage() {
  return <VehicleListPage config={escooterConfig} />;
}