# Tailor Master API — production image (multi-stage).
# Build context = repository root:  docker build -f apps/api/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /app
# Prisma needs OpenSSL to build its engines.
RUN apk add --no-cache openssl
# Install workspace deps (root + api + web manifests for the workspace graph)
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci
# Build the API + generate the Prisma client (native + musl engines)
COPY . .
RUN npm run db:generate -w apps/api \
 && npm run build -w apps/api

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
# OpenSSL is required by the Prisma engines at runtime.
RUN apk add --no-cache openssl
# Non-root user; copied files are chowned so Prisma can use its engines.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=app:app /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=app:app /app/apps/api/package.json ./apps/api/package.json
USER app
EXPOSE 3001
# Apply pending migrations, then start. (Single-instance friendly; for multi-
# instance, move migrate to a dedicated release step.)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
