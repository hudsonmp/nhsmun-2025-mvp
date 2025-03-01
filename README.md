# MUN Connect Platform

## Overview

MUN Connect is a platform designed for Model United Nations participants, providing document management, authentication, and integration with Google Drive for seamless document sharing and collaboration.

## System Requirements

- Python 3.10+ for the backend
- Node.js 16+ for the frontend
- npm or yarn package manager

## Getting Started

### First-time Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nhsmun-2025-mvp.git
   cd nhsmun-2025-mvp
   ```

2. **Set up the backend**
   ```bash
   # Create virtual environment
   python3 -m virtualenv backend_venv
   
   # Activate virtual environment
   source backend_venv/bin/activate  # On Windows: backend_venv\Scripts\activate
   
   # Install dependencies
   pip install supabase fastapi uvicorn python-dotenv pydantic python-jose passlib python-multipart
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create `.env.local` files in both the backend and frontend directories using the provided examples:
   
   - `backend/.env.local`:
     ```
     # Supabase Configuration
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     
     # JWT Configuration
     SECRET_KEY=your_secret_key
     ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=60
     
     # FastAPI Configuration
     BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
     ```
   
   - `frontend/.env.local`:
     ```
     # Supabase Configuration
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     
     # Google Drive API Configuration
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
     NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
     
     # API URL
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```

### Starting the Application

#### Method 1: Starting Servers Individually

1. **Start the backend server**
   ```bash
   source backend_venv/bin/activate  # On Windows: backend_venv\Scripts\activate
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start the frontend server**
   ```bash
   cd frontend
   npm run dev
   ```

#### Method 2: Using Helper Scripts

We've provided convenience scripts to manage the application:

1. **To restart all services** (kill any existing processes and prepare for a fresh start)
   ```bash
   npm run restart
   ```

2. **To start both backend and frontend**
   ```bash
   npm run start
   ```

### Access the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Features

- **Authentication**: User registration, login, and session management
- **Document Management**: Create, read, update, and delete documents
- **Google Drive Integration**: Connect with Google Drive for document storage
- **Responsive UI**: Modern interface that works on desktop and mobile devices

## Troubleshooting

### Port Conflicts

If you encounter port conflicts, use the restart script to clear existing processes:

```bash
npm run restart
```

### Backend Dependency Issues

If you encounter issues with backend dependencies:

```bash
source backend_venv/bin/activate
pip install --upgrade -r backend/requirements.txt
```

### Frontend Dependency Issues

If you encounter issues with frontend dependencies:

```bash
cd frontend
npm install
```

## For Detailed Setup Instructions

For more detailed instructions on configuring Supabase and Google Drive integration, please refer to:
- [frontend/SETUP_INSTRUCTIONS.md](frontend/SETUP_INSTRUCTIONS.md)

## License

[MIT License](LICENSE) 