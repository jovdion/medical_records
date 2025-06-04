# Use the official Node.js 18 image as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code from the frontend directory
COPY . .

# Ensure proper permissions and file existence
RUN ls -la && \
    chmod -R 755 . && \
    echo "Checking for index.html:" && ls -la index.html && \
    echo "Checking for login.html:" && ls -la login.html

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "start"] 