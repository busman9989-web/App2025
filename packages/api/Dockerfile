# packages/api/Dockerfile

# ---- Builder Stage ----
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./tsup.config.ts ./ 

# Clean install to fix the npm optional dependencies bug
RUN rm -rf node_modules package-lock.json
RUN npm install --force

# Force install the missing Rollup binary
RUN npm install --force @rollup/rollup-linux-x64-gnu

# Copy source files
COPY ./src ./src
COPY ./prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client
RUN npx prisma generate --schema prisma/schema.prisma

# Build the application
RUN npm run build


# ---- Production Stage ----
FROM node:20-slim AS runner

WORKDIR /usr/src/app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files and install production dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --omit=dev

# Copy the built application code
COPY --from=builder /usr/src/app/dist ./dist

# Copy the generated Prisma client files
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy the Prisma schema file
COPY --from=builder /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# Create public/avatars directory for uploads
RUN mkdir -p /usr/src/app/public/avatars

# Copy and make executable the startup script
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["./entrypoint.sh"]

EXPOSE 3000

# ✅ Set the entrypoint to run the script, which handles migrations and starts the server
ENTRYPOINT ["./entrypoint.sh"]