-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- User policies
-- Allow users to view their own data
CREATE POLICY user_select_policy ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data (except ID and creation date)
CREATE POLICY user_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);

-- Document policies
-- Allow authenticated users to create documents
CREATE POLICY document_insert_policy ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own documents
CREATE POLICY document_select_own_policy ON documents
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own documents
CREATE POLICY document_update_policy ON documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own documents
CREATE POLICY document_delete_policy ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Enable read-only access to some documents for all authenticated users
-- (if you want to implement sharing functionality)
-- CREATE POLICY document_select_shared_policy ON documents
--   FOR SELECT USING (is_public = true); 