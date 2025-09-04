#!/bin/bash
# This script creates the package.json files for both the API and Web services.

set -e

# --- Color Definitions ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="carer-connect-monorepo"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory '$PROJECT_DIR' not found.${NC}"
    echo "Please run this script from the parent directory of your project (e.g., 'Project Care')."
    exit 1
fi

echo -e "${CYAN}--- Creating package.json files ---${NC}"

# --- 1. Create Backend package.json ---
echo -e "\n${YELLOW}Creating backend package.json...${NC}"
cat > "$PROJECT_DIR/packages/api/package.json" << 'EOF'
{
  "name": "api",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^8.0.1",
    "@fastify/rate-limit": "^9.1.0",
    "@levminer/speakeasy": "^1.4.2",
    "argon2": "^0.40.3",
    "dotenv": "^16.4.5",
    "fastify": "^4.28.1",
    "pg": "^8.12.0",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/node": "^20.14.9",
    "@types/pg": "^8.11.6",
    "@types/qrcode": "^1.5.5",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3"
  }
}
EOF
echo -e "${GREEN}✅ Backend package.json created.${NC}"

# --- 2. Create Frontend package.json ---
echo -e "\n${YELLOW}Creating frontend package.json...${NC}"
cat > "$PROJECT_DIR/packages/web/package.json" << 'EOF'
{
  "name": "web-vue",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "jwt-decode": "^4.0.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.31",
    "vue-router": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.9",
    "@vitejs/plugin-vue": "^5.0.5",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.1",
    "vue-tsc": "^2.0.26"
  }
}
EOF
echo -e "${GREEN}✅ Frontend package.json created.${NC}"

echo -e "\n\n${GREEN}🎉 Script finished! Both package.json files have been created successfully. 🎉${NC}\n"