# ---- Builder Stage ----
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./tsup.config.ts ./ 

# Install ALL dependencies for the build
RUN npm install

COPY ./src ./src
COPY ./prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client
RUN npx prisma generate --schema prisma/schema.prisma

# Build the application
RUN npm run build


# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install the OpenSSL compatibility package that Prisma needs
RUN apk add --no-cache openssl3

# Copy ONLY production dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --omit=dev

# Copy the built application code
COPY --from=builder /usr/src/app/dist ./dist

# Copy the generated Prisma client files
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy the Prisma schema file itself
COPY --from=builder /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# ✅ Copy the startup script into the container
COPY ./entrypoint.sh .

# ✅ Make the startup script executable
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

# ✅ Set the entrypoint to run the script, which handles migrations and starts the server
ENTRYPOINT ["./entrypoint.sh"]