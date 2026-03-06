FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.js ./

RUN mkdir -p /data

CMD ["node", "index.js"]
