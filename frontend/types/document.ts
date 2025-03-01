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
  format_status: 'valid' | 'issues' | 'not_checked';
}

export type DocumentType = 'position_paper' | 'resolution' | 'speech' | 'research';
export type CommitteeType = 'UNSC' | 'UNHRC' | 'UNEP' | 'DISEC' | 'WHO' | 'ECOSOC';
export type FormatStatusType = 'valid' | 'issues' | 'not_checked';

export interface DocumentFilters {
  type: string;
  committee: string;
  country: string;
  searchQuery: string;
} 