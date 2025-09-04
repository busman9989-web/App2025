#!/bin/bash
# This script creates the frontend API client file and its directory.

set -e

# --- Color Definitions ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="carer-connect-monorepo"
API_CLIENT_DIR="$PROJECT_DIR/packages/web/src/api"
API_CLIENT_FILE="$API_CLIENT_DIR/index.ts"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory '$PROJECT_DIR' not found.${NC}"
    echo "Please run this script from the parent directory of your project (e.g., 'Project Care')."
    exit 1
fi

echo -e "${CYAN}--- Creating Frontend API Client ---${NC}"

# --- 1. Create the api directory ---
if [ ! -d "$API_CLIENT_DIR" ]; then
    echo -e "\n${YELLOW}Creating directory: $API_CLIENT_DIR...${NC}"
    mkdir -p "$API_CLIENT_DIR"
    echo -e "${GREEN}✅ Directory created.${NC}"
else
    echo -e "\n${GREEN}✅ Directory $API_CLIENT_DIR already exists.${NC}"
fi

# --- 2. Create the index.ts file ---
echo -e "\n${YELLOW}Creating file: $API_CLIENT_FILE...${NC}"
cat > "$API_CLIENT_FILE" << 'EOF'
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// This "interceptor" automatically attaches your login token to every
// request you send to the backend, which is critical for security.
api.interceptors.request.use(
  (config) => {
    // We must initialize the store inside the interceptor to avoid circular dependency issues
    // that can happen when files import each other.
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
EOF
echo -e "${GREEN}✅ API client file created successfully.${NC}"

echo -e "\n\n${GREEN}🎉 Script finished! The API client is now in place. 🎉${NC}\n"