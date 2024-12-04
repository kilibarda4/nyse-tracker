# Use the official Node.js image from the Docker Hub
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

# Copy project
COPY . /app/

# Build the app
RUN npm run build

# Install serve to serve the build
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 5000

# Serve the app
CMD ["serve", "-s", "build"]
