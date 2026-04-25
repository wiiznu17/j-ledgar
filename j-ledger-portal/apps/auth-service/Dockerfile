FROM node:20-alpine AS base

# --- Stage 1: Prune ---
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune auth-service --docker

# --- Stage 2: Installer ---
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First copy only the pruned lockfiles and package.json
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY turbo.json turbo.json
# Skip postinstall scripts during docker build
RUN npm install --ignore-scripts

# Build the project
COPY --from=pruner /app/out/full/ .
# Build shared packages first
RUN npx turbo build --filter=@repo/dto
# Generate prisma client after source is copied
RUN cd apps/auth-service && npx prisma generate
RUN npx turbo build --filter=auth-service

# --- Stage 3: Runner ---
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app/apps/auth-service/package.json .
COPY --from=installer /app/apps/auth-service/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
# Copy compiled shared packages
COPY --from=installer /app/packages/dto/dist ./packages/dto/dist
COPY --from=installer /app/packages/dto/package.json ./packages/dto/package.json
# Copy prisma
COPY --from=installer /app/apps/auth-service/prisma ./prisma
COPY --from=installer /app/package.json .

EXPOSE 3003

CMD ["node", "dist/main"]
