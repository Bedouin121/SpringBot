# Stage 1: Build the React app
FROM node:16 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# Stage 2: Serve the React app using nginx
FROM nginx:alpine
# Copy the built React app from the previous stage
COPY --from=build /app/build /usr/share/nginx/html
# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to serve the application
EXPOSE 80
# Start nginx
CMD ["nginx", "-g", "daemon off;"]
