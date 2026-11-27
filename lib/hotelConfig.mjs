import { headers } from "next/headers";

import {
  resolveHotelConfig,
  validatedHotels,
} from "./hotelConfigCore.mjs";

export * from "./hotelConfigCore.mjs";

// Obter automaticamente a configuração do hotel do pedido atual
export async function getRequestHotelConfig() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  return resolveHotelConfig(host, validatedHotels);
}