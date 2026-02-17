# ===========================================
# Stage 1: Dependencies (cached layer)
# ===========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --no-audit --no-fund

# ===========================================
# Stage 2: Builder (build frontend)
# ===========================================
FROM deps AS builder

WORKDIR /app

# Copy source code
COPY . .

# Set build-time environment variables
ARG VITE_PROXY_TARGET
ENV VITE_PROXY_TARGET=${VITE_PROXY_TARGET}

# Build the frontend
RUN npm run build

# Prune devDependencies for production
RUN npm prune --production

# ===========================================
# Stage 3: Production runtime
# ===========================================
FROM node:20-alpine AS production

# Install ca-certificates for HTTPS requests
RUN apk add --no-cache ca-certificates curl && \
    update-ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Environment defaults
ENV NODE_ENV=production \
    PORT=9230 \
    NODE_OPTIONS='--max-old-space-size=512'

EXPOSE 9230

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:9230/api/health || exit 1

# Start server
CMD ["node", "server/index.js"]

# ===========================================
# Stage 4: Development (for docker-compose dev)
# ===========================================
FROM node:20-alpine AS development

# Install ca-certificates and useful dev tools
RUN apk add --no-cache ca-certificates curl && \
    update-ca-certificates

WORKDIR /app

# Set development environment
ENV NODE_ENV=development \
    HUSKY=0

# Default command (can be overridden)
CMD ["npm", "run", "dev"]