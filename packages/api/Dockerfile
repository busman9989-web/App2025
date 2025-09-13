# carer-connect-monorepo/packages/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY ./package*.json ./
COPY ./prisma ./prisma

# Install ALL dependencies (including dev) for the build step
RUN npm cache clean --force && rm -rf node_modules && npm install

# Copy tsconfig.json and src/ *BEFORE* running the build script
COPY ./tsconfig.json ./
COPY ./src ./src

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build # Execute the "build" script from package.json (which runs tsc)


# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copy ONLY production dependencies from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy Prisma client from builder
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json

# Copy compiled JavaScript (from 'dist' folder, assuming `tsc` compiles to 'dist')
COPY --from=builder /usr/src/app/dist ./dist

# REMOVED: COPY ./packages/api/.env ./.env as env_file in docker-compose handles it


# Expose port (if your API listens on a specific port, e.g., 3000)
EXPOSE 3000

# Run the compiled JavaScript application
CMD ["node", "dist/index.js"]