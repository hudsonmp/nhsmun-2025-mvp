export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  committee: string;
  country: string;
  topic: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  user: User;
  format_status: 'valid' | 'issues' | 'pending' | 'not_checked';
  format_issues?: string[];
  sync_status?: string;
  last_synced?: string;
  // Fields that match the actual database schema
  storage_path?: string;
  drive_file_id?: string;
  drive_web_link?: string;
  drive_metadata?: any;
  is_public?: boolean;
}

export type DocumentType = 'position_paper' | 'resolution' | 'speech' | 'research';
export type CommitteeType = 'UNSC' | 'UNHRC' | 'UNEP' | 'DISEC' | 'WHO' | 'ECOSOC';
export type FormatStatusType = 'valid' | 'issues' | 'pending' | 'not_checked';
export type FileType = 'pdf' | 'docx' | 'gdoc';

export interface DocumentFilters {
  type: string;
  committee: string;
  country: string;
  searchQuery: string;
}

// New interfaces for document upload
export interface DocumentUploadMetadata {
  title: string;
  type: DocumentType;
  committee: CommitteeType;
  country: string;
  topic: string;
  file_type?: string;
  create_google_doc?: boolean;
}

export interface DocumentUploadResponse {
  document: Document;
  upload_url?: string;
  google_doc_url?: string;
}

export interface DocumentConflict {
  id: string;
  document_id: string;
  conflict_type: 'duplicate_content' | 'conflicting_perspective';
  description: string;
  sections: string[];
  created_at: string;
  resolved: boolean;
} 