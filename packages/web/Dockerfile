# apps/api/Dockerfile

FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package.json and lockfile first (for caching layers)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the API source code
COPY . .

# Start in dev mode
CMD ["npm", "run", "dev"]
