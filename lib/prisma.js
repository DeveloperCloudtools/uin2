import { PrismaClient } from "@prisma/client";
import { getRequestHotelConfig } from "./requestHotelConfig.js";

const globalForPrisma = globalThis;
const clients = globalForPrisma.prismaClients || new Map();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClients = clients;
}

async function getRequestDatabaseUrl() {
  const { connectionString } = await getRequestHotelConfig();
  return connectionString;
}

async function getClient() {
  const databaseUrl = await getRequestDatabaseUrl();
  let client = clients.get(databaseUrl);

  if (!client) {
    client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    clients.set(databaseUrl, client);
  }

  return client;
}

export const prisma = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === Symbol.toStringTag) return "PrismaClient";
      if (property === "then") return undefined;

      if (typeof property === "string" && property.startsWith("$")) {
        return (...args) =>
          getClient().then((client) =>
            Reflect.apply(client[property], client, args)
          );
      }

      return new Proxy(
        {},
        {
          get(_delegate, method) {
            if (typeof method !== "string") return undefined;

            return (...args) =>
              getClient().then((client) => {
                const delegate = client[property];
                return Reflect.apply(delegate[method], delegate, args);
              });
          },
        }
      );
    },
  }
);
