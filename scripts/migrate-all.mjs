import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  resolveHotelConnectionString,
  validateHotelsConfig,
} from "../lib/hotelConfig.mjs";

const hotels = validateHotelsConfig(
  JSON.parse(readFileSync(new URL("../hotels.json", import.meta.url), "utf8"))
);
const failedHotels = [];

for (const hotel of hotels) {
  let databaseUrl;
  try {
    databaseUrl = resolveHotelConnectionString(hotel);
  } catch (error) {
    console.error(error.message);
    failedHotels.push(hotel.subdomain);
    continue;
  }

  console.log(`A aplicar migrações no hotel ${hotel.subdomain}...`);
  const result = spawnSync("prisma", ["migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error || result.status !== 0) {
    if (result.error) {
      console.error(`Falha ao iniciar o Prisma: ${result.error.message}`);
    } else {
      console.error(
        `Migração do hotel ${hotel.subdomain} terminou com código ${result.status}.`
      );
    }
    failedHotels.push(hotel.subdomain);
  }
}

if (failedHotels.length) {
  console.error(`Hotéis com migração falhada: ${failedHotels.join(", ")}.`);
  process.exitCode = 1;
} else {
  console.log("Migrações aplicadas em todos os hotéis.");
}
