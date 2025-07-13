# Use Node.js 16 LTS with Python 3.9 (stable for node-gyp)
FROM node:16-buster

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-distutils \
    python3-setuptools \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S luckseeker -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R luckseeker:nodejs /app
USER luckseeker

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]