FROM node:20 AS base

# --- Stage 1: Prune ---
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune admin-auth-service --docker

# --- Stage 2: Installer ---
FROM base AS installer
WORKDIR /app

# First copy only the pruned lockfiles and package.json
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY turbo.json turbo.json
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
# Generate prisma client after source is copied
RUN cd apps/admin-auth-service && npx prisma generate
RUN npx turbo build --filter=admin-auth-service
# Run prisma client postinstall to ensure it's properly initialized
RUN cd node_modules/@prisma/client && node scripts/postinstall.js

# --- Stage 3: Runner ---
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=installer /app/apps/admin-auth-service/package.json .
COPY --from=installer /app/apps/admin-auth-service/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
# Copy prisma and generated client
COPY --from=installer /app/apps/admin-auth-service/prisma ./prisma
COPY --from=installer /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=installer /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=installer /app/package.json .
# Run prisma client postinstall in runner as root before switching user
RUN cd node_modules/@prisma/client && node scripts/postinstall.js
USER nestjs

EXPOSE 3005

CMD ["node", "dist/src/main"]
