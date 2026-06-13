FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --omit=dev
RUN npm install tsx

# Generate Prisma client
RUN npx prisma generate

# Copy worker source
COPY worker ./worker
COPY lib/db.ts ./lib/db.ts

# Create non-root user
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker
USER worker

CMD ["npx", "tsx", "worker/index.ts"]
