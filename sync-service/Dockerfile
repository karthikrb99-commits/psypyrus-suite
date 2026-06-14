# ── Build Stage ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better cache layering)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for Prisma codegen)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY src ./src/

# ── Production Stage ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Only copy production node_modules and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Create non-root user for security
RUN addgroup -S psypyrus && adduser -S psypyrus -G psypyrus
USER psypyrus

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
