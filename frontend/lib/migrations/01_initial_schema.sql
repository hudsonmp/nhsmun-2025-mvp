-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    committee TEXT NOT NULL,
    country TEXT NOT NULL,
    topic TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES public.users(id),
    format_status TEXT DEFAULT 'not_checked',
    format_issues TEXT[],
    storage_path TEXT,
    file_type TEXT,
    file_size INTEGER,
    drive_file_id TEXT,
    drive_web_link TEXT,
    drive_metadata JSONB,
    sync_status TEXT DEFAULT 'pending',
    last_synced TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT false
);

-- Create document_conflicts table
CREATE TABLE IF NOT EXISTS public.document_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id),
    conflict_type TEXT NOT NULL,
    description TEXT NOT NULL,
    sections TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    resolved BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_drive_file_id ON public.documents(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_document_conflicts_document_id ON public.document_conflicts(document_id);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_conflicts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can read their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

-- Document conflicts policies
CREATE POLICY "Users can read conflicts for their documents"
    ON public.document_conflicts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.documents
        WHERE documents.id = document_conflicts.document_id
        AND documents.user_id = auth.uid()
    )); 