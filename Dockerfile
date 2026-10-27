# syntax=docker/dockerfile:1

# Etapa 1: compilar la landing (React + Vite) a estaticos.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: nginx sirve el build con las cabeceras de seguridad.
FROM nginx:1.27-alpine
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
