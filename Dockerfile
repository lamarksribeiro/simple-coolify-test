FROM node:18-alpine

# Instala curl para o healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Healthcheck: verifica o endpoint /health a cada 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
