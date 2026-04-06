# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including devDeps for tsc + prisma CLI)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Generate Prisma client targeting linux-musl (Alpine's libc)
RUN npx prisma generate
RUN npm run build

# Prune to production deps only (keeps @prisma/client + prisma CLI, removes tsc/tsx etc.)
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine

# Install openssl — required by Prisma's query engine binary on Alpine
RUN apk add --no-cache openssl

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built assets and pruned production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Give appuser ownership of everything so Prisma can write
# its query-engine cache files into node_modules/@prisma/engines
RUN chown -R appuser:appgroup /app

# Set environment to production
ENV NODE_ENV=production

USER appuser

EXPOSE 3001

# Healthcheck to verify the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
