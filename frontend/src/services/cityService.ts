import { ApiClient } from "@/utils/ApiClient";

export type City = {
  id: number;
  name: string;
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
};

export async function fetchCities():  Promise<City[]>{
  return ApiClient.getInstance().get<City[]>('/api/core/cities/');
}