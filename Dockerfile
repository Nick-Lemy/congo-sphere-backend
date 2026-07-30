FROM node:24-alpine AS builder
RUN apk add --no-cache pnpm
WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:24-alpine AS runner
RUN apk add --no-cache pnpm
WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
