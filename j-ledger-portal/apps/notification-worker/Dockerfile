FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npx nest build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main"]
