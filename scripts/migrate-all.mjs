
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import {
  resolveHotelConnectionString,
  getValidatedHotels,
} from "../lib/hotelConfigCore.mjs";

// Ler configuração dos hotéis
const hotels = getValidatedHotels(
  JSON.parse(
    readFileSync(
      new URL("../hotels.json", import.meta.url),
      "utf8"
    )
  )
);

const failedHotels = [];

console.log(`Foram encontrados ${hotels.length} hotéis.`);

// Aplicar migrações em cada hotel
for (const hotel of hotels) {
  console.log("\n----------------------------------------");
  console.log(`Hotel: ${hotel.subdomain}`);
  console.log("----------------------------------------");

  let databaseUrl;

  try {
    databaseUrl = resolveHotelConnectionString(hotel);

    if (!databaseUrl) {
      throw new Error(
        `DATABASE_URL não definida para o hotel ${hotel.subdomain}.`
      );
    }
  } catch (error) {
    console.error(`Erro na configuração: ${error.message}`);
    failedHotels.push(hotel.subdomain);
    continue;
  }

  console.log(
    `A aplicar migrações no hotel ${hotel.subdomain}...`
  );

  const result = spawnSync(
    "npm",
    ["exec", "--", "prisma", "migrate", "deploy"],
    {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (result.error || result.status !== 0) {
    if (result.error) {
      console.error(
        `Falha ao iniciar o Prisma: ${result.error.message}`
      );
    } else {
      console.error(
        `Migração do hotel ${hotel.subdomain} terminou com código ${result.status}.`
      );
    }

    failedHotels.push(hotel.subdomain);
    continue;
  }

  console.log(
    `Migrações concluídas com sucesso para ${hotel.subdomain}.`
  );
}

// Resultado final
console.log("\n========================================");

if (failedHotels.length > 0) {
  console.error(
    `Migrações falhadas: ${failedHotels.join(", ")}.`
  );

  process.exitCode = 1;
} else {
  console.log(
    "Migrações aplicadas com sucesso em todos os hotéis."
  );
}

console.log("========================================");
