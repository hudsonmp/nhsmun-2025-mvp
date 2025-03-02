import { createClient } from '@supabase/supabase-js';
import { Document, DocumentUploadMetadata, DocumentConflict } from './document';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// Enable persistent sessions in localStorage by default
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'nhsmun-auth-storage-key',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Function to check if the user is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Function to get the current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

/*
 * Document Storage Functions
 * 
 * Supabase Schema Setup Instructions:
 * 1. Create 'documents' table with fields:
 *    - id: uuid (primary key, default: uuid_generate_v4())
 *    - title: text (not null)
 *    - type: text (not null)
 *    - committee: text (not null)
 *    - country: text (not null)
 *    - topic: text (not null)
 *    - content: text
 *    - created_at: timestamp with time zone (default: now())
 *    - updated_at: timestamp with time zone
 *    - user_id: uuid (foreign key to auth.users)
 *    - format_status: text (default: 'not_checked')
 *    - file_path: text
 *    - file_type: text
 *    - file_size: integer
 *    - google_doc_id: text
 *    - sync_status: text (default: 'pending')
 *    - last_synced: timestamp with time zone
 * 
 * 2. Create 'document_conflicts' table with fields:
 *    - id: uuid (primary key, default: uuid_generate_v4())
 *    - document_id: uuid (foreign key to documents.id)
 *    - conflict_type: text (not null)
 *    - description: text (not null)
 *    - sections: text[] (array)
 *    - created_at: timestamp with time zone (default: now())
 *    - resolved: boolean (default: false)
 *
 * 3. Set up storage bucket 'documents' with security rules
 *    that allow authenticated users to upload/download
 */

// Document storage functions
export const documentAPI = {
  // Get all documents for the current user
  getDocuments: async (): Promise<Document[]> => {
    try {
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          type,
          committee,
          country,
          topic,
          content,
          created_at,
          updated_at,
          user_id,
          format_status,
          storage_path,
          drive_file_id,
          sync_status,
          last_synced,
          is_public
        `);
      
      if (docError) {
        console.error('Error fetching documents:', docError);
        throw new Error(`Failed to fetch documents: ${docError.message}`);
      }
      
      if (!documents || documents.length === 0) {
        return [];
      }
      
      // Fetch user data separately and combine
      const userIdSet = new Set(documents.map(doc => doc.user_id));
      const userIds = Array.from(userIdSet);
      
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, username, name')
        .in('id', userIds);
      
      if (userError) {
        console.error('Error fetching users:', userError);
        // Don't throw here, just use placeholder user data
      }
      
      // Map users to documents
      return documents.map(doc => {
        const user = users?.find(u => u.id === doc.user_id) || {
          id: doc.user_id,
          email: 'unknown@example.com',
          username: 'unknown',
          name: 'Unknown User'
        };
        
        return {
          ...doc,
          user
        } as Document;
      });
    } catch (error: any) {
      console.error('Error in getDocuments:', error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  },

  // Get a single document by ID
  getDocument: async (documentId: string): Promise<Document | null> => {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        type,
        committee,
        country,
        topic,
        content,
        created_at,
        updated_at,
        user_id,
        format_status,
        storage_path,
        drive_file_id,
        is_public
      `)
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, name')
      .eq('id', data.user_id)
      .single();
    
    if (userError) {
      // If user not found, create placeholder user
      const user = {
        id: data.user_id,
        email: '',
        username: '',
        name: ''
      };
      
      return {
        ...data,
        user
      } as Document;
    }
    
    return {
      ...data,
      user: userData
    } as Document;
  },

  // Create a new document with metadata
  createDocument: async (metadata: DocumentUploadMetadata): Promise<Document> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, ensure user exists in the users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || 'unknown@example.com',
          username: user.email?.split('@')[0] || 'unknown',
          name: user.user_metadata?.name || 'Unknown User'
        }, {
          onConflict: 'id'
        });

      if (userError) {
        console.error('Error upserting user:', userError);
        throw new Error(`Failed to create/update user: ${userError.message}`);
      }

      // Then create the document
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          title: metadata.title,
          type: metadata.type,
          committee: metadata.committee,
          country: metadata.country,
          topic: metadata.topic,
          user_id: user.id,
          format_status: 'pending',
          file_type: metadata.file_type || 'gdoc',
          sync_status: 'pending',
          last_synced: new Date().toISOString()
        })
        .select()
        .single();
      
      if (docError) {
        console.error('Error creating document:', docError);
        throw new Error(`Failed to create document: ${docError.message}`);
      }

      if (!doc) {
        throw new Error('Document created but no data returned');
      }

      return {
        ...doc,
        user: {
          id: user.id,
          email: user.email || 'unknown@example.com',
          username: user.email?.split('@')[0] || 'unknown',
          name: user.user_metadata?.name || 'Unknown User'
        }
      } as Document;
    } catch (error: any) {
      console.error('Error in createDocument:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  },

  // Generate a signed URL for file upload
  getUploadUrl: async (documentId: string, fileName: string, fileType: string): Promise<string> => {
    const filePath = `${documentId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(filePath);
    
    if (error) throw error;
    
    // Update the document with the file path
    await supabase
      .from('documents')
      .update({ storage_path: filePath })
      .eq('id', documentId);
    
    return data.signedUrl;
  },

  // Update document metadata
  updateDocument: async (documentId: string, metadata: Partial<Document>): Promise<Document> => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .update({
          ...metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();
      
      if (docError) {
        console.error('Error updating document:', docError);
        throw new Error(`Failed to update document: ${docError.message}`);
      }

      if (!doc) {
        throw new Error('Document updated but no data returned');
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, username, name')
        .eq('id', doc.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      return {
        ...doc,
        user: userData || {
          id: doc.user_id,
          email: 'unknown@example.com',
          username: 'unknown',
          name: 'Unknown User'
        }
      } as Document;
    } catch (error: any) {
      console.error('Error in updateDocument:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  },

  // Get document sync status
  getSyncStatus: async (documentId: string): Promise<{
    document_id: string;
    drive_file_id?: string;
    sync_status?: string;
    format_status?: string;
    last_synced?: string;
  } | null> => {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        drive_file_id,
        sync_status,
        format_status,
        last_synced
      `)
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      document_id: data.id,
      drive_file_id: data.drive_file_id,
      sync_status: data.sync_status,
      format_status: data.format_status,
      last_synced: data.last_synced
    };
  },

  // Get document conflicts
  getConflicts: async (documentId: string): Promise<DocumentConflict[]> => {
    const { data, error } = await supabase
      .from('document_conflicts')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Resolve a conflict
  resolveConflict: async (conflictId: string): Promise<void> => {
    const { error } = await supabase
      .from('document_conflicts')
      .update({ resolved: true })
      .eq('id', conflictId);
    
    if (error) throw error;
  },

  // Subscribe to document changes
  subscribeToDocument: (documentId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`document-${documentId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents',
        filter: `id=eq.${documentId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to document conflicts
  subscribeToConflicts: (documentId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`conflicts-${documentId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'document_conflicts',
        filter: `document_id=eq.${documentId}`
      }, callback)
      .subscribe();
  },

  // Validate document format
  validateDocumentFormat: async (documentId: string): Promise<void> => {
    // In a real implementation, this would call a backend API to validate the document
    // For testing, we'll simulate a validation process
    
    // First update status to 'pending'
    await supabase
      .from('documents')
      .update({
        format_status: 'pending'
      })
      .eq('id', documentId);
    
    // Simulate a validation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomly decide if the document is valid or has issues (for testing)
    const validationResult = Math.random() > 0.5 ? 'valid' : 'issues';
    
    // Prepare potential issues if status is 'issues'
    const formatIssues = validationResult === 'issues' 
      ? [
          'Incorrect heading format', 
          'Missing country flag in header', 
          'Inconsistent citation style'
        ].filter(() => Math.random() > 0.5) // Randomly select some issues
      : [];
    
    // Update the document with validation results
    await supabase
      .from('documents')
      .update({
        format_status: validationResult,
        format_issues: formatIssues.length > 0 ? formatIssues : null
      })
      .eq('id', documentId);
  }
};

export default supabase; 