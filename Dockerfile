# =========================================================
# Stage 1 — Frontend Build (Vite)
# Builds static assets into /dist
# =========================================================
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend

# Copy only package files first for better layer caching
COPY frontend/package*.json ./

# Deterministic dependency installation
RUN npm ci --no-audit --no-fund

# Copy source code
COPY frontend/ .

# Empty value means frontend will call same-domain /api
ENV VITE_API_URL=

# Public key is safe to expose in frontend build
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build frontend
RUN npm run build


# =========================================================
# Stage 2 — Backend Build (TypeScript → JavaScript)
# Produces compiled server inside /dist
# =========================================================
FROM node:22-bookworm-slim AS backend-build

WORKDIR /app/backend

# Copy package files first
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy backend source
COPY backend/ .

# Build TypeScript project
RUN npm run build


# =========================================================
# Stage 3 — Production Runtime
# Lightweight production image
# =========================================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --no-audit --no-fund \
  && npm cache clean --force

# Copy compiled backend
COPY --from=backend-build --chown=node:node /app/backend/dist ./dist

# Copy frontend static assets
COPY --from=frontend-build --chown=node:node /app/frontend/dist ./public

# App runs on port 3001
EXPOSE 3001

# Security: run container as non-root user
USER node

# Start production server
CMD ["node", "dist/index.js"]