# ===============================
# Stage 1 — Build
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances
COPY package*.json ./
COPY prisma ./prisma

RUN npm install

# Génération Prisma
RUN npx prisma generate

# Code source
COPY . .

# Build TypeScript → dist/
RUN npm run build


# ===============================
# Stage 2 — Production
# ===============================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Dépendances prod uniquement
COPY package*.json ./
RUN npm install --omit=dev

# Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Code compilé
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Render injecte $PORT
EXPOSE 10000

CMD ["node", "dist/main.js"]