# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NodeJS"

WORKDIR /app

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

# Copy package files
COPY --link package.json bun.lock* ./

# Install ALL dependencies (including devDependencies) for building
# Don't set NODE_ENV=production here because we need devDependencies to compile
RUN npm install

# Copy application code
COPY --link . .

# Build application (this needs typescript from devDependencies)
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Final stage for app image
FROM base

# Set production environment
ENV NODE_ENV=production

# Install PM2 globally
RUN npm install -g pm2

# Copy built application and production dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/ecosystem.config.cjs ./ecosystem.config.cjs

# Create data and logs directories
RUN mkdir -p /data /app/logs

# Expose ports (though Fly.io uses internal_port from fly.toml)
EXPOSE 8080

# Start all servers with PM2
CMD [ "npm", "run", "start" ]
