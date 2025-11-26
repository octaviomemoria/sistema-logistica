### Stage 1: build backend and client
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package.json and lockfiles
COPY package*.json ./
COPY tsconfig.json ./

# Install backend deps
RUN npm ci --silent

# Copy backend source
COPY src ./src

# Build backend
RUN npm run build

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps --silent
COPY client ./client
RUN npm run --prefix client build

### Stage 2: runtime
FROM node:18-alpine AS runtime
WORKDIR /app

# Copy built backend and node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

CMD [ "node", "dist/app.js" ]
