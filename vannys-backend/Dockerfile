# =============================================================
# VANNYS TOUCH — Backend Dockerfile
# Multi-stage build : builder → runner
# Compatible Render (Debian bookworm / OpenSSL 3.x)
# =============================================================

# ── Stage 1 : Builder ────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

# Install OpenSSL (required for Prisma engine compilation)
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first (layer cache)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install ALL deps (including devDependencies needed for build)
RUN npm ci --ignore-scripts

# Generate Prisma client with correct binary targets
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json nest-cli.json ./
COPY src ./src/

RUN npm run build

# ── Stage 2 : Runner ─────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy production deps manifest
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install production deps only
RUN npm ci --omit=dev --ignore-scripts

# Re-generate Prisma client in production image (same OS = correct binary)
RUN npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
