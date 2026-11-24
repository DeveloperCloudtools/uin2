# Use an official Node.js runtime as a base image
FROM node:20-buster

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project (including server.js and prisma folder)
COPY . .

# Prisma generation validates the datasource URL but does not connect to it.
ARG DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

# Build the application with a placeholder URL; runtime uses the configured hotel URL.
RUN DATABASE_URL="${DATABASE_URL}" npm run build

# Expose the app port
EXPOSE 3000

# Start the application using your custom Express server
CMD ["npm", "run", "start"]