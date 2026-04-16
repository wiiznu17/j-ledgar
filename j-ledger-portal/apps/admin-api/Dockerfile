FROM node:20-alpine AS base

# --- Stage 1: Prune ---
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune admin-api --docker

# --- Stage 2: Installer ---
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First copy only the pruned lockfiles and package.json
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
# Copy prisma schema to allow postinstall generation
COPY apps/admin-api/prisma/schema.prisma ./apps/admin-api/prisma/schema.prisma
COPY turbo.json turbo.json
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN npx prisma generate --schema=apps/admin-api/prisma/schema.prisma
RUN npx turbo build --filter=admin-api

# --- Stage 3: Runner ---
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app/apps/admin-api/package.json .
COPY --from=installer /app/apps/admin-api/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/admin-api/node_modules/@prisma/client-admin ./node_modules/@prisma/client-admin
COPY --from=installer /app/apps/admin-api/prisma ./prisma
COPY --from=installer /app/package.json .

CMD ["node", "dist/src/main"]
