# --- Stage 1: Build client ---
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npx vite build

# --- Stage 2: Build server ---
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# --- Stage 3: Production ---
FROM node:22-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg build-base \
    && pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Install prod dependencies (includes native better-sqlite3 build)
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && apk del build-base

# Compiled server
COPY --from=server-build /app/server/dist ./dist
# Built client → served by Express as static
COPY --from=client-build /app/client/dist ./public

# Data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DB_PATH=/app/data/musicplay.db
EXPOSE 3001

CMD ["node", "dist/index.js"]
