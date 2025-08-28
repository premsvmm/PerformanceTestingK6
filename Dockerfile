# Multi-stage Dockerfile for K6 Performance Testing
# Stage 1: Base image with dependencies
FROM grafana/k6:latest as base

USER root

# Install system dependencies
RUN apk update && \
    apk add --no-cache \
    openvpn \
    curl \
    jq \
    bash \
    && rm -rf /var/cache/apk/*

# Stage 2: Development image with additional tools
FROM base as development

RUN apk add --no-cache \
    git \
    vim \
    htop \
    && rm -rf /var/cache/apk/*

# Stage 3: Production image
FROM base as production

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY config/ ./config/
COPY utils/ ./utils/

# Copy test files
COPY tests/ ./tests/
COPY vpnconfig/ ./vpnconfig/

# Copy scripts
COPY scripts/ ./scripts/
COPY entrypoint.sh ./

# Make scripts executable
RUN chmod +x entrypoint.sh && \
    chmod +x scripts/*.sh 2>/dev/null || true

# Create directories for outputs
RUN mkdir -p /app/reports /app/logs /app/data

# Set proper permissions
RUN chown -R k6:k6 /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use non-root user
USER k6

# Default environment variables
ENV ENVIRONMENT=dev
ENV TEST_PROFILE=smoke
ENV DEBUG=false
ENV LOG_LEVEL=info

ENTRYPOINT ["./entrypoint.sh"]