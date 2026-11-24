import { headers } from "next/headers";
import { resolveHotelConfig } from "./hotelConfig.js";

export async function getRequestHotelConfig() {
  let host;
  try {
    host = (await headers()).get("host");
  } catch (error) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL é necessária quando não existe um host de requisição.",
        { cause: error }
      );
    }
  }

  return resolveHotelConfig(host);
}
