# carer-connect-monorepo/packages/web/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# This command should run the Vite dev servers
CMD ["npm", "run", "dev"]