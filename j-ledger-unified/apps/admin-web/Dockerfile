FROM node:20-alpine AS base

# --- Stage 1: Prune ---
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune admin-web --docker

# --- Stage 2: Installer ---
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First copy only the pruned lockfiles and package.json
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY turbo.json turbo.json
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN npx turbo build --filter=admin-web

# --- Stage 3: Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output: 'standalone' from next.config.ts
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin-web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin-web/.next/static ./apps/admin-web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin-web/public ./apps/admin-web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/admin-web/server.js"]
