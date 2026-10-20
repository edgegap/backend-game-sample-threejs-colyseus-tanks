# Edgegap game server image (linux/amd64):
#   docker build --platform linux/amd64 -t registry.edgegap.com/<project>/realtime-tanks:<tag> server
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=2567
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY tsconfig.json ./
COPY src ./src
# Internal port. The Edgegap app version maps it as "gameport", protocol TCP, TLS Upgrade on.
EXPOSE 2567/tcp
USER node
# Node is PID 1, so it gets Edgegap's SIGTERM and Colyseus shuts the rooms down cleanly.
CMD ["node", "--import", "tsx", "src/index.ts"]
