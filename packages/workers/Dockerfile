# Dockerfile - Workers
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/workers/package*.json ./packages/workers/
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the workers
WORKDIR /app/packages/workers
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copy built application
COPY --from=builder /app/packages/workers/dist ./dist
COPY --from=builder /app/packages/workers/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

USER worker

EXPOSE 4000

CMD ["node", "dist/index.js"]