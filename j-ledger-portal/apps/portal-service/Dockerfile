# Build context: j-ledger-portal/ (monorepo root)
# docker build -f apps/portal-service/Dockerfile -t j-ledger/portal-service:latest .

FROM node:20-alpine AS build
WORKDIR /app

# Ignore platform-specific package checks (e.g. @next/swc-darwin-arm64 from lockfile)
RUN echo "force=true" > /root/.npmrc

# Copy monorepo-level package files
COPY package.json package-lock.json turbo.json ./

# Copy only the packages/workspaces we need
COPY packages/dto/package.json ./packages/dto/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/portal-service/package.json ./apps/portal-service/

RUN npm install --ignore-scripts --no-audit --no-fund \
      --workspace=packages/dto \
      --workspace=packages/typescript-config \
      --workspace=apps/portal-service \
      --include-workspace-root

# Copy shared packages source
COPY packages/dto ./packages/dto

# Build shared packages
RUN npm run build --workspace=packages/dto

# Copy portal-service source
COPY apps/portal-service/prisma ./apps/portal-service/prisma
COPY apps/portal-service/tsconfig*.json ./apps/portal-service/
COPY apps/portal-service/nest-cli.json ./apps/portal-service/
COPY apps/portal-service/src ./apps/portal-service/src

# Generate Prisma client and build
WORKDIR /app/apps/portal-service
RUN npx prisma generate
RUN npx nest build

# --- Production Stage ---
FROM node:20-alpine
WORKDIR /app

RUN echo "force=true" > /root/.npmrc

COPY package.json package-lock.json turbo.json ./
COPY packages/dto/package.json ./packages/dto/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/portal-service/package.json ./apps/portal-service/

RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund \
      --workspace=packages/dto \
      --workspace=packages/typescript-config \
      --workspace=apps/portal-service \
      --include-workspace-root

COPY --from=build /app/packages/dto/dist ./packages/dto/dist
COPY --from=build /app/apps/portal-service/dist ./apps/portal-service/dist
COPY --from=build /app/apps/portal-service/prisma ./apps/portal-service/prisma

WORKDIR /app/apps/portal-service
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
