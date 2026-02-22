# Stage 1: build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm ci
COPY ./frontend .
RUN npm run build

# Stage 2: nginx runtime
FROM nginx:alpine
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/build /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
