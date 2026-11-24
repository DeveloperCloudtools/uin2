# syntax=docker/dockerfile:1

# Use an official Node.js runtime as a base image
FROM node:20-buster

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project (including server.js and prisma folder)
COPY . .

# Prisma generation needs a syntactically valid datasource URL but does not connect to it.
ARG DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

# Migrations consume the mounted config and environment only during this build step.
RUN --mount=type=secret,id=hotels_config,target=/app/hotels.json \
    --mount=type=secret,id=database_env,target=/app/.env \
    DATABASE_URL="${DATABASE_URL}" npm run db:migrate:all && \
    DATABASE_URL="${DATABASE_URL}" npm run build

# Expose the app port
EXPOSE 3000

# Start the application using your custom Express server
CMD ["npm", "run", "start"]