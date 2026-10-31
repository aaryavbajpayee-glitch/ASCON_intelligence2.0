# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for bundling)
RUN npm ci

# Copy project source tree
COPY . .

# Run strict TypeScript verification and production builds
RUN npm run typecheck
RUN npm run build

# ==========================================
# Stage 2: Production runtime
# ==========================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy pre-compiled distribution bundles from builder
COPY --from=builder /app/dist ./dist

# Create persistent database vault directory with non-root permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Declare volume for persistent SQLite storage
VOLUME ["/app/data"]

# Run under secure non-root node user
USER node

EXPOSE 3000

# Docker healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
