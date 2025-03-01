# MUN Connect

A platform for Model United Nations delegates to research, prepare, and share documents.

## Table of Contents
- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
  - [Using Helper Scripts](#using-helper-scripts)
  - [Starting the Application](#starting-the-application)
  - [Stopping the Application](#stopping-the-application)
  - [Port Management](#port-management)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Supabase Configuration](#supabase-configuration)
  - [Google Drive Integration](#google-drive-integration)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Logs and Debugging](#logs-and-debugging)

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Supabase account (for authentication and database)
- Google Cloud Platform account (for Google Drive integration)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mun-connect.git
   cd mun-connect
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies (if applicable)
   cd ../backend
   npm install
   ```

### Environment Configuration

1. Create a `.env.local` file in the `frontend` directory with the following content:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
   ```

2. Create a `.env.local` file in the `backend` directory (if applicable):
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
   ```

## Running the Application

### Using Helper Scripts

We've provided helper scripts to make it easier to manage the application:

1. **NPM Scripts** - The simplest way to manage the application:
   ```bash
   # From the project root
   
   # Kill all ports and start both servers
   npm run dev
   
   # Just restart (kill ports and set up environment)
   npm run restart
   
   # Just start both servers
   npm run start
   
   # Start only the frontend
   npm run start:frontend
   
   # Start only the backend
   npm run start:backend
   ```

2. **Restart Script** - Kills all running ports and sets up environment files:
   ```bash
   # From the project root
   ./restart.sh
   ```
   This script:
   - Kills any processes running on ports 3000, 3001, and 8000
   - Checks for `.env.local` files and creates them if missing
   - Renames any `.env` files to `.env.local` if needed
   - Provides instructions for starting the services

3. **Start Script** - Starts both backend and frontend concurrently:
   ```bash
   # From the project root
   ./start.sh
   ```
   This script:
   - Installs the `concurrently` package if needed
   - Verifies environment files exist
   - Starts both backend and frontend services in a single terminal
   - Ensures the frontend runs on port 3000 and backend on port 8000

4. **Recommended Workflow**:
   ```bash
   # Easiest option (kills ports and starts servers)
   npm run dev
   
   # Or if you prefer the shell scripts:
   ./restart.sh
   ./start.sh
   ```

### Starting the Application

1. Start the backend server (if applicable):
   ```bash
   cd backend
   npm run dev
   ```
   This will start the backend server on port 8000 by default.

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```
   This will start the Next.js development server on port 3000.

3. Access the application at `http://localhost:3000` in your browser.

### Stopping the Application

1. To stop the running servers, press `Ctrl+C` in the terminal where each server is running.

### Port Management

If you encounter port conflicts or need to manage ports:

1. **Check which processes are using specific ports**:

   **macOS/Linux**:
   ```bash
   # Find processes using port 3000
   lsof -i :3000
   
   # Alternative using netstat
   netstat -tuln | grep 3000
   ```

   **Windows**:
   ```bash
   # Find processes using port 3000
   netstat -ano | findstr :3000
   ```

2. **Kill processes using specific ports**:

   **macOS/Linux**:
   ```bash
   # Kill process by PID
   kill <PID>
   
   # Force kill if necessary
   kill -9 <PID>
   
   # Kill all processes using port 3000
   kill $(lsof -t -i:3000)
   ```

   **Windows**:
   ```bash
   # Kill process by PID
   taskkill /PID <PID> /F
   ```

3. **Restart the application with specific port**:

   To explicitly set the port for the frontend:
   ```bash
   # For Next.js frontend
   npx next dev -p 3000
   ```

   To explicitly set the port for the backend:
   ```bash
   # Set PORT environment variable before starting
   PORT=8000 npm run dev
   ```

4. **Kill all potentially conflicting ports and restart the application**:

   Use this script to kill all common development ports and restart the application:
   ```bash
   # macOS/Linux
   kill $(lsof -t -i:3000) $(lsof -t -i:3001) $(lsof -t -i:8000) 2>/dev/null || true
   
   # Start backend (in a new terminal)
   cd backend
   npm run dev
   
   # Start frontend (in a new terminal)
   cd frontend
   npm run dev
   ```

## Development

### Project Structure

- `frontend/` - Next.js application
  - `app/` - Next.js app router components
  - `components/` - Reusable UI components
  - `lib/` - Utility functions and API clients
  - `public/` - Static assets

- `backend/` - Backend server (if applicable)
  - `routes/` - API route handlers
  - `models/` - Data models
  - `services/` - Business logic

### Supabase Configuration

See the detailed [Supabase Setup Instructions](./SETUP_INSTRUCTIONS.md) for configuration details.

### Google Drive Integration

See the detailed [Supabase Setup Instructions](./SETUP_INSTRUCTIONS.md) for Google Drive integration details.

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Follow the port management instructions to kill processes using the required ports.
   - Check if you have other development servers running.

2. **Environment variables not loading**:
   - Ensure your `.env.local` files are in the correct locations.
   - Restart the servers after modifying environment files.
   - For Next.js, make sure environment variables meant for client usage are prefixed with `NEXT_PUBLIC_`.

3. **Authentication issues with Supabase**:
   - Check Supabase authentication logs in the Supabase dashboard.
   - Verify your Supabase URL and keys are correct in the environment files.
   - Ensure CORS settings in Supabase allow your localhost domains.

4. **Google Drive integration issues**:
   - Verify your Google Cloud Platform credentials are correct.
   - Check that you've enabled the necessary APIs in the Google Cloud Console.
   - Ensure you've set up OAuth consent screen and added test users if in development.

### Logs and Debugging

1. **Frontend logs**:
   - Check your browser's developer console (F12) for errors.
   - Next.js logs will appear in the terminal where you started the frontend.

2. **Backend logs**:
   - Server logs will appear in the terminal where you started the backend.
   - For detailed logging, set `DEBUG=true` in your backend environment file.

3. **Supabase logs**:
   - Authentication logs: Supabase Dashboard → Authentication → Logs
   - Database logs: Supabase Dashboard → Database → Logs

4. **Network requests**:
   - Use browser DevTools → Network tab to monitor API requests and responses.
   - Look for CORS errors, authentication failures, or other HTTP errors. 