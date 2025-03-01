#!/bin/bash

# Color for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== MUN Connect Application Startup =====${NC}"

# Check if concurrently is installed locally
if [ ! -d "./node_modules/concurrently" ]; then
  echo -e "${YELLOW}Installing concurrently package locally...${NC}"
  npm install --save-dev concurrently
  echo -e "${GREEN}Successfully installed concurrently.${NC}"
fi

# Check if Python dependencies are installed
if ! python3 -c "import fastapi" &> /dev/null; then
  echo -e "${YELLOW}Installing Python backend dependencies...${NC}"
  cd backend && python3 -m pip install -r requirements.txt
  cd ..
  echo -e "${GREEN}Successfully installed Python dependencies.${NC}"
fi

# Verify environment files
if [ ! -f "./backend/.env.local" ]; then
  echo -e "${RED}Warning: backend/.env.local not found.${NC}"
  echo -e "${YELLOW}Please run ./restart.sh first to set up environment files.${NC}"
  exit 1
fi

if [ ! -f "./frontend/.env.local" ]; then
  echo -e "${RED}Warning: frontend/.env.local not found.${NC}"
  echo -e "${YELLOW}Please run ./restart.sh first to set up environment files.${NC}"
  exit 1
fi

echo -e "${GREEN}Starting backend and frontend concurrently...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both services.${NC}"

# Start both backend and frontend using locally installed concurrently
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue.bold,green.bold" \
  "cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" \
  "cd frontend && npx next dev -p 3000" 