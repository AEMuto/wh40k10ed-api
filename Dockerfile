# ---- Base Stage ----
FROM node:22-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
FROM base AS deps
COPY app/package.json app/package-lock.json* ./
RUN npm install --frozen-lockfile

# ---- Build Stage ----
FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY app/ .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apk add --no-cache cron

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY app/package.json .

COPY crontab /etc/crontabs/root
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "start"]