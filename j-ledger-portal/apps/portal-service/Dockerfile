FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npx nest build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
