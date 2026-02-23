export interface VehicleSpec {
    label: string;
    key: string;
}

export interface VehicleConfig {
    type: string;
    label: string;
    iconPath: string;
    rateLabel: string;
    badgeColor: string;
    specs: VehicleSpec[];
    bookingRoute: string;
}

export abstract class VehicleFactory {

  abstract createConfig(): VehicleConfig;
  getLabel(): string {
    return this.createConfig().label;
  }
  getBookingRoute(): string {
    return this.createConfig().bookingRoute;
  }
}
