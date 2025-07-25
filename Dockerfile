# Use Alpine with Python 3.10 and Node.js 18
FROM node:18-alpine3.18

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    py3-setuptools \
    make \
    g++ \
    curl \
    linux-headers

# Install additional Python packages needed for swisseph
RUN python3 -m pip install --no-cache-dir setuptools wheel

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