FROM node:24-alpine AS builder
RUN apk add --no-cache pnpm
WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:24-alpine AS runner
RUN apk add --no-cache pnpm
WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --ignore-scripts \
    && pnpm store prune \
    && rm -rf /root/.cache /root/.local/share/pnpm/store \
    && rm -rf node_modules/.pnpm/prisma@* \
              node_modules/.pnpm/@prisma+studio-core* \
              node_modules/.pnpm/@prisma+dev* \
              node_modules/.pnpm/@electric-sql+pglite* \
              node_modules/.pnpm/effect@* \
              node_modules/.pnpm/typescript@* \
              node_modules/.pnpm/prettier@*

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main"]
