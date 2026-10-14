FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types packages/types
RUN pnpm install --filter @causal/api... --frozen-lockfile=false
COPY apps/api apps/api
RUN pnpm --filter @causal/api build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node","dist/server.js"]
