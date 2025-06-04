# Use the official Node.js 18 image as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy serve configuration
COPY serve.json ./

# Copy the rest of your app's source code
COPY . ./

# Debug: List files
RUN echo "Current directory contents:" && \
    ls -la && \
    echo "Verifying key files:" && \
    ls -la index.html && \
    ls -la login.html && \
    ls -la js/

# Set correct permissions
RUN chmod -R 755 .

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "start"] 