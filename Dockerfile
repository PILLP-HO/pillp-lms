# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy the rest of your project (excluding files in .dockerignore)
COPY . .

# Stage 2: Runtime
FROM node:18-alpine AS runner

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set working directory
WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/data ./data

# Expose port used by Express
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]
