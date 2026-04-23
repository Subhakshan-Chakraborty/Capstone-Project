# Stage 1 — dependencies
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# Stage 2 — minimal runtime
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8002

CMD ["node", "index.js"]