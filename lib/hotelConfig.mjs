
import hotelsConfig from "../hotels.json" with { type: "json" };
import { headers } from "next/headers";

import {
  resolveHotelConfig,
  validateHotelsConfig,
} from "./hotelConfigCore.mjs";

export * from "./hotelConfigCore.mjs";

const validatedHotels = validateHotelsConfig(hotelsConfig);

// Obter automaticamente a configuração do hotel do pedido atual
export async function getRequestHotelConfig() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  return resolveHotelConfig(host, validatedHotels);
}
