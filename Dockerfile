FROM node:22-alpine AS base

RUN npm install -g pnpm

# Install Dependencies
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm fetch --frozen-lockfile && pnpm install --frozen-lockfile

# Build Stage
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production Stage
FROM node:22-alpine AS runner

WORKDIR /app

LABEL name="swas-panel"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

# Copy Project Files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Additional Environment Variables
ENV NODE_ENV=production

# Start the App
CMD ["node", "server.js"]
