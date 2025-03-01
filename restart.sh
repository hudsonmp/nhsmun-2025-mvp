#!/bin/bash

# Color for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== MUN Connect Application Restart =====${NC}"

# Kill all potentially conflicting ports
echo -e "${YELLOW}Killing all processes on ports 3000, 3001, 8000...${NC}"
kill $(lsof -t -i:3000) $(lsof -t -i:3001) $(lsof -t -i:8000) 2>/dev/null || true
echo -e "${GREEN}All conflicting processes terminated.${NC}"

# Check if .env.local exists in backend
if [ ! -f "./backend/.env.local" ]; then
  echo -e "${RED}Warning: backend/.env.local not found.${NC}"
  
  # Check if .env exists and needs to be renamed
  if [ -f "./backend/.env" ]; then
    echo -e "${YELLOW}Found backend/.env file. Renaming to .env.local...${NC}"
    mv ./backend/.env ./backend/.env.local
    echo -e "${GREEN}Successfully renamed backend/.env to backend/.env.local${NC}"
  else 
    echo -e "${YELLOW}Creating an empty backend/.env.local file. Please update it with your credentials.${NC}"
    touch ./backend/.env.local
  fi
fi

# Check if .env.local exists in frontend
if [ ! -f "./frontend/.env.local" ]; then
  echo -e "${RED}Warning: frontend/.env.local not found.${NC}"
  
  # Check if .env exists and needs to be renamed
  if [ -f "./frontend/.env" ]; then
    echo -e "${YELLOW}Found frontend/.env file. Renaming to .env.local...${NC}"
    mv ./frontend/.env ./frontend/.env.local
    echo -e "${GREEN}Successfully renamed frontend/.env to frontend/.env.local${NC}"
  else 
    echo -e "${YELLOW}Creating an empty frontend/.env.local file. Please update it with your credentials.${NC}"
    touch ./frontend/.env.local
  fi
fi

echo -e "${GREEN}Environment files have been configured.${NC}"
echo -e "${YELLOW}Please start your backend and frontend in separate terminals:${NC}"
echo -e "${BLUE}Terminal 1:${NC}"
echo -e "cd backend && npm run dev"
echo -e "${BLUE}Terminal 2:${NC}"
echo -e "cd frontend && npm run dev"

echo -e "${GREEN}Done! Your application should be accessible at http://localhost:3000${NC}"
echo -e "${YELLOW}Remember to check both terminal windows for any error messages.${NC}" 