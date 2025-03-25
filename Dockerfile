# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 6363

# Start the compiled JavaScript code
CMD ["sh", "-c", "npm run dev"]

