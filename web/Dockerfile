# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors and lockfiles
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full application sources
COPY . .

# Compile production Vite assets
RUN npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine AS production

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
