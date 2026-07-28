FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock* ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
RUN yarn install --frozen-lockfile
COPY src ./src
COPY drizzle ./drizzle
RUN yarn build && ls -la dist/

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle ./drizzle
EXPOSE 3001
CMD ["node", "dist/main.js"]