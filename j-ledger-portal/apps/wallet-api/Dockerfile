FROM node:20-alpine AS base

# --- Stage 1: Prune ---
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune wallet-api --docker

# --- Stage 2: Installer ---
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First copy only the pruned lockfiles and package.json
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
# Copy prisma schema to allow postinstall generation
COPY apps/wallet-api/prisma/schema.prisma ./apps/wallet-api/prisma/schema.prisma
COPY turbo.json turbo.json
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
# Build shared packages first
RUN npx turbo build --filter=@repo/dto
RUN npx prisma generate --schema=apps/wallet-api/prisma/schema.prisma
RUN npx turbo build --filter=wallet-api

# --- Stage 3: Runner ---
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app/apps/wallet-api/package.json .
COPY --from=installer /app/apps/wallet-api/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
# Copy compiled shared packages
COPY --from=installer /app/packages/dto/dist ./packages/dto/dist
COPY --from=installer /app/packages/dto/package.json ./packages/dto/package.json
# Copy generated Prisma client
COPY --from=installer /app/apps/wallet-api/node_modules/@prisma/client-wallet ./node_modules/@prisma/client-wallet
COPY --from=installer /app/apps/wallet-api/prisma ./prisma
COPY --from=installer /app/package.json .

CMD ["node", "dist/src/main"]
