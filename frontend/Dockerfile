# Base image with upgraded npm
FROM node:20-alpine AS base
RUN npm install -g npm@11.11.0
WORKDIR /app

# Development stage (installs devDependencies too)
FROM base AS dev-env
COPY . .
RUN npm ci
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build-env
COPY . .
RUN npm ci
RUN npm run build

# Production runtime
FROM base AS runtime
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build-env /app/build ./build
CMD ["npm", "run", "start"]
