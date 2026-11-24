import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveHotelConfig,
  resolveHotelDatabaseUrl,
} from "./hotelConfig.mjs";

const hotels = [
  {
    subdomain: "Teste",
    connectionString: "${HOTEL_TESTE_DATABASE_URL}",
    NEXTAUTH_URL: "${HOTEL_TESTE_NEXTAUTH_URL}",
    PROJECT_URL: "${HOTEL_TESTE_PROJECT_URL}",
    MINIO_BUCKET: "${HOTEL_TESTE_MINIO_BUCKET}",
  },
];

test("resolves a hotel database from the request subdomain", () => {
  assert.equal(
    resolveHotelDatabaseUrl(
      "TESTE.example.com:3000",
      hotels,
      { HOTEL_TESTE_DATABASE_URL: "mysql://db/teste" }
    ),
    "mysql://db/teste"
  );
});

test("resolves per-hotel NextAuth, project, and MinIO settings", () => {
  assert.deepEqual(
    resolveHotelConfig("teste.example.com", hotels, {
      HOTEL_TESTE_DATABASE_URL: "mysql://db/teste",
      HOTEL_TESTE_NEXTAUTH_URL: "https://teste.example.com",
      HOTEL_TESTE_PROJECT_URL: "https://teste.example.com/",
      HOTEL_TESTE_MINIO_BUCKET: "teste-images",
    }),
    {
      connectionString: "mysql://db/teste",
      NEXTAUTH_URL: "https://teste.example.com",
      PROJECT_URL: "https://teste.example.com/",
      MINIO_BUCKET: "teste-images",
    }
  );
});

test("keeps database routing available when optional settings are unset", () => {
  const config = resolveHotelConfig("teste.example.com", hotels, {
    HOTEL_TESTE_DATABASE_URL: "mysql://db/teste",
  });

  assert.equal(config.connectionString, "mysql://db/teste");
  assert.equal(config.NEXTAUTH_URL, undefined);
  assert.equal(config.PROJECT_URL, undefined);
  assert.equal(config.MINIO_BUCKET, undefined);
});

test("uses DATABASE_URL for localhost only", () => {
  assert.equal(
    resolveHotelDatabaseUrl("localhost:3000", hotels, {
      DATABASE_URL: "mysql://db/local",
    }),
    "mysql://db/local"
  );
  assert.throws(
    () =>
      resolveHotelDatabaseUrl("unknown.example.com", hotels, {
        DATABASE_URL: "mysql://db/default",
      }),
    /Não existe configuração de hotel/
  );
});

test("reports a missing hotel connection variable", () => {
  assert.throws(
    () => resolveHotelDatabaseUrl("teste.example.com", hotels, {}),
    /HOTEL_TESTE_DATABASE_URL/
  );
});
