This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Multi-hotel databases

The application selects a database from the first label in the request host.
For example, `teste.example.com` uses the hotel whose `subdomain` is `Teste`.
Each hotel can also define a `name`, used for the page title and metadata
description. Keep each hotel in the root-level `hotels.json` and set its
`connectionString` to an environment-variable reference such as
`${HOTEL_TESTE_DATABASE_URL}`. Copy `.env.example` to `.env` and set the
connection strings and each hotel's `NEXTAUTH_URL`, `PROJECT_URL`, and
`MINIO_BUCKET` there. The local `.env` file is ignored by Git. Docker Compose
passes all variables from `.env` into the container, so new `HOTEL_*` variables
do not need separate entries in `docker-compose.yml`.

The reverse proxy must preserve the incoming `Host` header. Hosts that do not
match a configured hotel are rejected; `localhost` uses `DATABASE_URL` for
local development. For each hotel, define the variables referenced by its
`connectionString`, `NEXTAUTH_URL`, `PROJECT_URL`, and `MINIO_BUCKET` in
`.env`. NextAuth uses the configured hotel's `NEXTAUTH_URL` for redirects and
trusts `x-forwarded-host` and `x-forwarded-proto`, so the reverse proxy must
overwrite those headers with the public request host and protocol.

Apply the Prisma migrations to every configured hotel, in sequence, with:

```bash
npm run db:migrate:all
```

`docker compose build` runs this command before generating Prisma Client and
building Next.js. In Docker, BuildKit mounts `.env` and `hotels.json` as
temporary build secrets. A build may therefore change one or more databases
even if a later migration or the application build fails. The migration command
reports failure if any hotel could not be migrated; successful migrations are
not rolled back. BuildKit does not use secret contents as a cache key; if only
`.env` changes, run `docker compose build --no-cache` to force the migration
step to execute again.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
