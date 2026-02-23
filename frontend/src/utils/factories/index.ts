import { VehicleFactory, VehicleConfig } from "./VehicleFactory";
import { CarFactory }      from "./CarFactory";
import { BikeFactory }     from "./BikeFactory";
import { EScooterFactory } from "./EScooterFactory.ts";

export type VehicleType = "car" | "bike" | "escooter";

const factoryRegistry: Record<VehicleType, VehicleFactory> = {
  car:      new CarFactory(),
  bike:     new BikeFactory(),
  escooter: new EScooterFactory(),
};

export function getVehicleConfig(type: VehicleType): VehicleConfig {
  const factory = factoryRegistry[type];
  if (!factory) {
    throw new Error(`No factory registered for vehicle type: "${type}"`);
  }
  return factory.createConfig();
}

export function getAllVehicleConfigs(): VehicleConfig[] {
  return Object.values(factoryRegistry).map((f) => f.createConfig());
}

export { VehicleFactory, VehicleConfig } from "./VehicleFactory";
export { CarFactory }      from "./CarFactory";
export { BikeFactory }     from "./BikeFactory";
export { EScooterFactory } from "./EScooterFactory.ts";