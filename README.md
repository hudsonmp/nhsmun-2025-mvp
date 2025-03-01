# MUN Connect Platform

A comprehensive platform for Model United Nations delegates that provides tools for research, speechwriting, and document management.

## Features

- Document Repository: Upload, categorize, and search position papers and resolutions
- AI Research Assistant: Get intelligent insights on any topic
- Speechwriting AI: Create compelling speeches with AI-powered tools
- Document Format Checker: Ensure your documents comply with MUN standards

## Tech Stack

### Backend
- FastAPI
- Supabase (Authentication, Database, Storage)
- Python 3.9+

### Frontend
- Next.js 14
- React 18
- TailwindCSS
- TypeScript

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or later)
- Python 3.9+
- Supabase account
- npm or yarn

### 2. Supabase Setup

1. **Create a Supabase Project**:
   - Sign up at [Supabase](https://supabase.io/)
   - Create a new project
   - Save your project URL and API keys

2. **Setup Database Tables**:
   - From the Supabase dashboard, navigate to SQL Editor
   - Create the required tables by executing the following SQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  committee VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  topic VARCHAR NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  format_status VARCHAR DEFAULT 'not_checked'
);

-- Create indexes for faster queries
CREATE INDEX documents_user_id_idx ON documents(user_id);
CREATE INDEX documents_type_idx ON documents(type);
CREATE INDEX documents_committee_idx ON documents(committee);
CREATE INDEX documents_country_idx ON documents(country);
```

3. **Enable Row Level Security (RLS)**:
   - Go to Authentication → Policies
   - Enable RLS on both tables
   - Add policies to ensure users can only access their own data

### 3. Backend Setup

1. **Clone the Repository**:
```bash
git clone <repository-url>
cd <repository-folder>
```

2. **Environment Setup**:
```bash
cd backend
cp .env.example .env
```

3. **Update the .env File**:
   - Add your Supabase URL and API key
   - Generate a secret key for JWT (you can use `openssl rand -hex 32`)

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT Configuration
SECRET_KEY=your_secret_key_for_jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# FastAPI Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

4. **Install Dependencies and Run**:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend should now be running on http://localhost:8000

### 4. Frontend Setup

1. **Navigate to Frontend Directory**:
```bash
cd frontend
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Create .env.local File**:
```bash
touch .env.local
```

4. **Add Environment Variables**:
```
BACKEND_URL=http://localhost:8000
```

5. **Run Development Server**:
```bash
npm run dev
```

The frontend should now be running on http://localhost:3000

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   └── documents.py
│   │   │   └── auth.py
│   │   ├── database/
│   │   │   └── supabase_client.py
│   │   ├── schemas/
│   │   │   ├── document.py
│   │   │   └── user.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── lib/
    │   └── api.ts
    ├── types/
    │   ├── axios.d.ts
    │   └── js-cookie.d.ts
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## Development

When running in development mode, the backend server runs on port 8000 and the frontend runs on port 3000.

## Deployment

### Backend Deployment (Docker)

```bash
cd backend
docker build -t mun-platform-backend .
docker run -p 8000:8000 mun-platform-backend
```

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
```

Deploy to Vercel by connecting your GitHub repository or using the Vercel CLI:

```bash
npm install -g vercel
vercel
```

## License

[MIT](LICENSE) 