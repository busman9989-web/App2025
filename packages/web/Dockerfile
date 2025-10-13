FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Vite dev server configuration
ENV HOST=0.0.0.0
ENV PORT=5173
ENV CHOKIDAR_USEPOLLING=true

# Set HMR host - use your machine's IP here
# For local development on the same machine: use 127.0.0.1
# For remote access: use your machine's actual IP
ENV VITE_HMR_HOST=127.0.0.1

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]