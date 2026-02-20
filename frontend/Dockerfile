# Base image with upgraded npm
FROM node:20-alpine AS base
RUN npm install -g npm@11.10.0
WORKDIR /app

# Development dependencies
FROM base AS development-dependencies-env
COPY . .
RUN npm ci

# Production dependencies
FROM base AS production-dependencies-env
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base AS build-env
COPY . .
COPY --from=development-dependencies-env /app/node_modules ./node_modules
RUN npm run build

# Final runtime image
FROM base AS runtime
COPY package.json package-lock.json ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build
CMD ["npm", "run", "start"]
