# Use lightweight Node.js base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only the package.json and lockfile
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy all source files
COPY . .

# No build step needed for plain Express app

# Use another lightweight image for runtime
FROM node:18-alpine AS runner

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set working directory
WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Expose the dynamic port
EXPOSE 3000

# Run the app
CMD ["node", "src/index.js"]
