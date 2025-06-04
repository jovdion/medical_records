# Use Node.js 16 as the base image
FROM node:16-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Make copy-files.sh executable and run it
RUN chmod +x copy-files.sh && ./copy-files.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
