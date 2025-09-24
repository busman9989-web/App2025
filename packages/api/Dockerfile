# packages/api/Dockerfile

# ---- Builder Stage ----
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY ./package*.json ./
COPY ./tsconfig.json ./
# Make sure tsup config is copied if you use it
COPY ./tsup.config.ts ./ 

# Install ALL dependencies for the build
RUN npm install

# Copy source code including the seed file now that it's in src/
COPY ./src ./src

# Copy only schema.prisma, as seed.ts is now in src/
COPY ./prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client (will find schema.prisma in the copied path)
RUN npx prisma generate --schema prisma/schema.prisma

# Build the application using tsup (will now compile src/**/*.ts including src/seed.ts)
RUN npm run build


# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install the OpenSSL compatibility package that Prisma needs for specific binaryTargets
RUN apk add --no-cache openssl3

# Copy ONLY production dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --omit=dev

# Copy the built application code (now includes compiled seed.js from src/seed.ts -> dist/seed.js)
COPY --from=builder /usr/src/app/dist ./dist

# Copy the generated Prisma client files
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy the Prisma schema file itself, needed by the Prisma client at runtime
COPY --from=builder /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3000

CMD ["npm", "run", "start"]
