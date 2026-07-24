# Tailor Master API — production image (multi-stage).
# Build context = repository root:  docker build -f apps/api/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /app
# Install workspace deps (root + api + web manifests for the workspace graph)
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci
# Build the API + generate the Prisma client
COPY . .
RUN npm run db:generate -w apps/api \
 && npm run build -w apps/api

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
# Non-root user
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
USER app
EXPOSE 3001
# Apply pending migrations, then start. (Single-instance friendly; for multi-
# instance, move migrate to a dedicated release step.)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
