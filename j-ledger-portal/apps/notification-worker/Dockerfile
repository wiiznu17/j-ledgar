# Build context: j-ledger-portal/ (monorepo root)
# docker build -f apps/notification-worker/Dockerfile -t j-ledger/notification-worker:latest .

FROM node:20-alpine AS build
WORKDIR /app

# Ignore platform-specific package checks (e.g. @next/swc-darwin-arm64 from lockfile)
RUN echo "force=true" > /root/.npmrc

# Copy monorepo package files
COPY package.json package-lock.json turbo.json ./
COPY packages/dto/package.json ./packages/dto/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/notification-worker/package.json ./apps/notification-worker/

# Install dependencies for selected workspaces only
RUN npm install --ignore-scripts --no-audit --no-fund \
      --workspace=packages/dto \
      --workspace=packages/typescript-config \
      --workspace=apps/notification-worker \
      --include-workspace-root

# Copy shared packages source
COPY packages/dto ./packages/dto

# Build shared packages
RUN npm run build --workspace=packages/dto

# Copy notification-worker source
COPY apps/notification-worker/tsconfig.json ./apps/notification-worker/
COPY apps/notification-worker/nest-cli.json ./apps/notification-worker/
COPY apps/notification-worker/src ./apps/notification-worker/src
COPY apps/portal-service/prisma ./apps/portal-service/prisma

# Generate Prisma client and build
RUN npx prisma generate --schema=apps/portal-service/prisma/schema.prisma
WORKDIR /app/apps/notification-worker
RUN npx nest build

# --- Production Stage ---
FROM node:20-alpine
WORKDIR /app

RUN echo "force=true" > /root/.npmrc

COPY package.json package-lock.json turbo.json ./
COPY packages/dto/package.json ./packages/dto/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/notification-worker/package.json ./apps/notification-worker/

RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund \
      --workspace=packages/dto \
      --workspace=packages/typescript-config \
      --workspace=apps/notification-worker \
      --include-workspace-root

COPY --from=build /app/packages/dto/dist ./packages/dto/dist
COPY --from=build /app/apps/notification-worker/dist ./apps/notification-worker/dist
COPY --from=build /app/apps/portal-service/prisma ./apps/portal-service/prisma

RUN npx prisma generate --schema=apps/portal-service/prisma/schema.prisma

WORKDIR /app/apps/notification-worker
CMD ["node", "dist/main"]
