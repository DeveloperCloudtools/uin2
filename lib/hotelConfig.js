import hotelsConfig from "../hotels.json" with { type: "json" };

let cachedHotels;

export function loadHotelsConfig() {
  if (cachedHotels) return cachedHotels;

  const hotels = hotelsConfig;
  if (!Array.isArray(hotels) || hotels.length === 0) {
    throw new Error("hotels.json deve conter uma lista de hotéis.");
  }

  const subdomains = new Set();
  for (const hotel of hotels) {
    if (
      typeof hotel?.subdomain !== "string" ||
      !hotel.subdomain.trim() ||
      typeof hotel.connectionString !== "string" ||
      !hotel.connectionString.trim()
    ) {
      throw new Error(
        "Cada hotel em hotels.json deve ter subdomain e connectionString."
      );
    }

    const subdomain = hotel.subdomain.trim().toLowerCase();
    if (subdomains.has(subdomain)) {
      throw new Error(`Subdomínio duplicado em hotels.json: ${subdomain}.`);
    }
    subdomains.add(subdomain);
  }

  cachedHotels = hotels;
  return cachedHotels;
}

export function resolveHotelConnectionString(hotel, env = process.env) {
  return resolveHotelValue(
    hotel.connectionString,
    hotel,
    "connectionString",
    env
  );
}

function resolveHotelValue(value, hotel, setting, env) {
  if (typeof value !== "string" || !value.trim()) return env[setting];

  const variable = /^\$\{([A-Z][A-Z0-9_]*)\}$/.exec(value);
  if (!variable) {
    if (value.includes("${")) {
      throw new Error(
        `Referência de variável inválida em ${setting} para o hotel ${hotel.subdomain}.`
      );
    }
    return value;
  }

  const settingValue = env[variable[1]] || env[setting];
  if (!settingValue) {
    if (setting === "connectionString") {
      throw new Error(
        `A variável ${variable[1]} do hotel ${hotel.subdomain} não está definida.`
      );
    }

    return undefined;
  }

  return settingValue;
}

export function resolveHotelConfig(
  host,
  hotels = loadHotelsConfig(),
  env = process.env
) {
  if (!host) {
    if (env.DATABASE_URL) {
      return {
        connectionString: env.DATABASE_URL,
        NEXTAUTH_URL: env.NEXTAUTH_URL,
        PROJECT_URL: env.PROJECT_URL,
        MINIO_BUCKET: env.MINIO_BUCKET,
      };
    }
    throw new Error("Não foi possível determinar o host nem DATABASE_URL.");
  }

  let hostname;
  try {
    hostname = new URL(`http://${host}`).hostname.toLowerCase();
  } catch (error) {
    throw new Error(`Host inválido: ${host}.`, { cause: error });
  }

  const subdomain = hostname.split(".")[0];
  const hotel = hotels.find(
    (entry) => entry.subdomain.trim().toLowerCase() === subdomain
  );
  if (hotel) {
    return {
      connectionString: resolveHotelConnectionString(hotel, env),
      NEXTAUTH_URL: resolveHotelValue(
        hotel.NEXTAUTH_URL,
        hotel,
        "NEXTAUTH_URL",
        env
      ),
      PROJECT_URL: resolveHotelValue(
        hotel.PROJECT_URL,
        hotel,
        "PROJECT_URL",
        env
      ),
      MINIO_BUCKET: resolveHotelValue(
        hotel.MINIO_BUCKET,
        hotel,
        "MINIO_BUCKET",
        env
      ),
    };
  }

  if (
    ["localhost", "127.0.0.1", "::1"].includes(hostname) &&
    env.DATABASE_URL
  ) {
    return {
      connectionString: env.DATABASE_URL,
      NEXTAUTH_URL: env.NEXTAUTH_URL,
      PROJECT_URL: env.PROJECT_URL,
      MINIO_BUCKET: env.MINIO_BUCKET,
    };
  }

  throw new Error(`Não existe configuração de hotel para o host ${hostname}.`);
}

export function resolveHotelDatabaseUrl(
  host,
  hotels = loadHotelsConfig(),
  env = process.env
) {
  return resolveHotelConfig(host, hotels, env).connectionString;
}
