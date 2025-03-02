/**
 * Google Drive API Integration Service
 * 
 * This service handles the integration with Google Drive API for document management
 * and real-time collaboration.
 * 
 * Google Cloud Project Setup Instructions:
 * 1. Create a new project in Google Cloud Console (https://console.cloud.google.com/)
 * 2. Enable the Google Drive API
 * 3. Configure OAuth consent screen
 *    - User Type: External
 *    - Application name: MUN Connect
 *    - Authorized domains: your-domain.com
 *    - Developer contact information: your-email@example.com
 * 4. Create OAuth 2.0 credentials
 *    - Application type: Web application
 *    - Name: MUN Connect Web Client
 *    - Authorized JavaScript origins: http://localhost:3000, https://your-domain.com
 *    - Authorized redirect URIs: http://localhost:3000/api/auth/callback/google, https://your-domain.com/api/auth/callback/google
 * 5. Add the following environment variables to your .env.local file:
 *    - GOOGLE_CLIENT_ID=your-client-id
 *    - GOOGLE_CLIENT_SECRET=your-client-secret
 *    - GOOGLE_API_KEY=your-api-key (for public API access)
 */

import { Document } from './document';

// Configuration options for Google Drive API
interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
}

// Default configuration - these values should be replaced with environment variables
const DEFAULT_CONFIG: GoogleDriveConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
  ],
};

// Google Drive API Service
export class GoogleDriveService {
  private gapiLoaded: boolean = false;
  private gisLoaded: boolean = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private config: GoogleDriveConfig;
  private initializationPromise: Promise<void> | null = null;
  
  constructor(config: Partial<GoogleDriveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!this.config.clientId) {
      throw new Error('Google Client ID is required but not provided');
    }
    if (!this.config.apiKey) {
      throw new Error('Google API Key is required but not provided');
    }
  }
  
  /**
   * Initialize the Google Drive API
   * This loads the required libraries and initializes the API client
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        // Load the Google API client library
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.async = true;
        script1.defer = true;
        script1.onload = () => {
          this.gapiLoaded = true;
          this.loadGapiClient().then(() => {
            if (this.gisLoaded) resolve();
          }).catch(reject);
        };
        script1.onerror = (error) => {
          console.error('Failed to load Google API client:', error);
          reject(new Error('Failed to load Google API client'));
        };
        document.body.appendChild(script1);
        
        // Load the Google Identity Services library
        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.async = true;
        script2.defer = true;
        script2.onload = () => {
          this.gisLoaded = true;
          this.initializeTokenClient();
          if (this.gapiLoaded) resolve();
        };
        script2.onerror = (error) => {
          console.error('Failed to load Google Identity Services:', error);
          reject(new Error('Failed to load Google Identity Services'));
        };
        document.body.appendChild(script2);
      } catch (error) {
        console.error('Error initializing Google Drive API:', error);
        reject(new Error(`Error initializing Google Drive API: ${error}`));
      }
    });

    return this.initializationPromise;
  }
  
  /**
   * Load the Google API client library
   */
  private async loadGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        window.gapi.load('client', {
          callback: async () => {
            try {
              await window.gapi.client.init({
                apiKey: this.config.apiKey,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              });
              resolve();
            } catch (error) {
              reject(`Error initializing GAPI client: ${error}`);
            }
          },
          onerror: (error: any) => reject(`Error loading GAPI client: ${error}`),
        });
      } catch (error) {
        reject(`Failed to load GAPI client: ${error}`);
      }
    });
  }
  
  /**
   * Initialize the Google Identity Services token client
   */
  private initializeTokenClient(): void {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          console.error(`Error getting access token: ${tokenResponse.error}`);
          return;
        }
        this.accessToken = tokenResponse.access_token;
        window.gapi.client.setToken(tokenResponse);
      },
    });
  }
  
  /**
   * Authenticate the user and request access to Google Drive
   */
  async authenticate(): Promise<boolean> {
    if (!this.initializationPromise) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      if (!this.tokenClient) {
        console.error('Token client not initialized. Attempting to reinitialize...');
        this.initializeTokenClient();
        if (!this.tokenClient) {
          throw new Error('Failed to initialize token client');
        }
      }
      
      try {
        this.tokenClient.callback = (resp: any) => {
          if (resp.error) {
            console.error('Error during authentication:', resp.error);
            resolve(false);
            return;
          }
          
          this.accessToken = resp.access_token;
          window.gapi.client.setToken({ access_token: this.accessToken });
          resolve(true);
        };
        
        if (!window.gapi.client.getToken()) {
          // Request an access token
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          // Already have an access token
          this.accessToken = window.gapi.client.getToken().access_token;
          resolve(true);
        }
      } catch (error) {
        console.error('Error authenticating:', error);
        resolve(false);
      }
    });
  }
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
  
  /**
   * Create a new Google Doc for a document
   * @param document The document to create a Google Doc for
   * @returns The ID and web view link of the created Google Doc
   */
  async createGoogleDoc(document: Document): Promise<{ id: string; webViewLink: string }> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
      if (!this.isAuthenticated()) {
        throw new Error('Failed to authenticate with Google Drive');
      }
    }
    
    try {
      // First, check if a doc with this ID already exists
      const existingDocs = await window.gapi.client.drive.files.list({
        q: `properties has { key='munConnectDocId' and value='${document.id}' }`,
        fields: 'files(id,webViewLink)',
      });

      if (existingDocs.result.files && existingDocs.result.files.length > 0) {
        console.log('Found existing Google Doc, returning its ID');
        return {
          id: existingDocs.result.files[0].id,
          webViewLink: existingDocs.result.files[0].webViewLink,
        };
      }

      // Create new document with metadata
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: document.title,
          mimeType: 'application/vnd.google-apps.document',
          description: `MUN Connect document: ${document.type} for ${document.committee} - ${document.country}`,
          properties: {
            munConnectDocId: document.id,
            documentType: document.type,
            committee: document.committee,
            country: document.country,
            createdAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
          },
        },
        fields: 'id,webViewLink,properties',
      });

      if (!response.result.id) {
        throw new Error('Created document is missing ID');
      }

      // Cache the document metadata
      try {
        const cacheKey = `doc_${document.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          googleDocId: response.result.id,
          webViewLink: response.result.webViewLink,
          lastSynced: new Date().toISOString(),
          metadata: response.result.properties,
        }));
      } catch (cacheError) {
        console.warn('Failed to cache document metadata:', cacheError);
        // Non-blocking error - continue even if caching fails
      }

      return {
        id: response.result.id,
        webViewLink: response.result.webViewLink,
      };
    } catch (error: any) {
      console.error('Error creating Google Doc:', error);
      const errorMessage = error.result?.error?.message || error.message || 'Unknown error';
      throw new Error(`Failed to create Google Doc: ${errorMessage}`);
    }
  }
  
  /**
   * Get a Google Doc by its ID
   * @param googleDocId The ID of the Google Doc to get
   * @returns The Google Doc metadata
   */
  async getGoogleDoc(googleDocId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
      if (!this.isAuthenticated()) {
        throw new Error('Failed to authenticate with Google Drive');
      }
    }
    
    try {
      // Check cache first
      const cacheKey = `doc_${googleDocId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - new Date(parsed.lastSynced).getTime();
        
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          return parsed;
        }
      }

      // Fetch fresh data
      const response = await window.gapi.client.drive.files.get({
        fileId: googleDocId,
        fields: 'id,name,webViewLink,modifiedTime,capabilities,properties',
      });

      if (!response.result) {
        throw new Error('Failed to get document data');
      }

      // Update cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          ...response.result,
          lastSynced: new Date().toISOString(),
        }));
      } catch (cacheError) {
        console.warn('Failed to update document cache:', cacheError);
        // Non-blocking error - continue even if caching fails
      }

      return response.result;
    } catch (error: any) {
      console.error('Error getting Google Doc:', error);
      const errorMessage = error.result?.error?.message || error.message || 'Unknown error';
      throw new Error(`Failed to get Google Doc: ${errorMessage}`);
    }
  }
  
  /**
   * Update a Google Doc's content
   * @param googleDocId The ID of the Google Doc to update
   * @param content The new content of the Google Doc
   */
  async updateGoogleDoc(googleDocId: string, content: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }
    
    try {
      // This is a simplified version. In a real implementation,
      // you would use the Google Docs API to update the document content.
      // For simplicity, we're just updating the document's metadata here.
      await window.gapi.client.drive.files.update({
        fileId: googleDocId,
        resource: {
          properties: {
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error(`Error updating Google Doc: ${error}`);
      throw new Error(`Failed to update Google Doc: ${error}`);
    }
  }
  
  /**
   * Export a Google Doc to a specific format (PDF, DOCX)
   * @param googleDocId The ID of the Google Doc to export
   * @param mimeType The mime type to export to (e.g., 'application/pdf')
   * @returns A URL to download the exported file
   */
  async exportGoogleDoc(googleDocId: string, mimeType: string): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${googleDocId}/export?mimeType=${encodeURIComponent(mimeType)}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to export Google Doc: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Error exporting Google Doc: ${error}`);
      throw new Error(`Failed to export Google Doc: ${error}`);
    }
  }
  
  /**
   * Watch for changes to a Google Doc
   * This is a placeholder for real-time sync functionality.
   * In a production environment, you would use the Google Drive API's
   * watch method or establish a WebSocket connection.
   * 
   * @param googleDocId The ID of the Google Doc to watch
   * @param callback The callback to call when the Google Doc changes
   * @returns A function to stop watching for changes
   */
  watchGoogleDoc(googleDocId: string, callback: (changes: any) => void): () => void {
    // This is a placeholder. In a real implementation, you would use the Google Drive API's
    // changes.watch method or establish a WebSocket connection.
    const checkInterval = 5000; // Check every 5 seconds
    let lastModified: string | null = null;
    
    const intervalId = setInterval(async () => {
      try {
        if (!this.isAuthenticated()) {
          console.warn('Not authenticated with Google Drive');
          return;
        }
        
        const doc = await this.getGoogleDoc(googleDocId);
        
        if (lastModified !== null && doc.modifiedTime !== lastModified) {
          // Document has changed
          callback({
            documentId: googleDocId,
            modifiedTime: doc.modifiedTime,
            // In a real implementation, you would include the actual changes
          });
        }
        
        lastModified = doc.modifiedTime;
      } catch (error) {
        console.error(`Error checking for Google Doc changes: ${error}`);
      }
    }, checkInterval);
    
    // Return a function to stop watching for changes
    return () => clearInterval(intervalId);
  }
  
  /**
   * Import a file from Google Drive
   * @param fileId The ID of the file to import
   * @returns The imported file data
   */
  async importFile(fileId: string): Promise<{ name: string; content: string; mimeType: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }
    
    try {
      // Get file metadata
      const metadataResponse = await window.gapi.client.drive.files.get({
        fileId,
        fields: 'name,mimeType',
      });
      
      const { name, mimeType } = metadataResponse.result;
      
      // Get file content
      const contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to get file content: ${contentResponse.statusText}`);
      }
      
      let content = '';
      
      if (mimeType === 'application/vnd.google-apps.document') {
        // Export Google Doc to text
        const exportUrl = await this.exportGoogleDoc(fileId, 'text/plain');
        const exportResponse = await fetch(exportUrl);
        content = await exportResponse.text();
      } else {
        // Get raw content for other file types
        content = await contentResponse.text();
      }
      
      return { name, content, mimeType };
    } catch (error) {
      console.error(`Error importing file: ${error}`);
      throw new Error(`Failed to import file: ${error}`);
    }
  }

  /**
   * List files from Google Drive
   * @param query Optional search query to filter files
   * @returns Array of Google Drive files
   */
  async listDriveFiles(query: string = '') {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // Use the Google Drive API to list files
      const response = await window.gapi.client.drive.files.list({
        pageSize: 50,
        fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
        q: query ? query : 'trashed = false',
        orderBy: 'modifiedTime desc'
      });

      console.log('Google Drive files:', response.result.files);
      return response.result.files || [];
    } catch (error) {
      console.error('Error listing Drive files:', error);
      throw error;
    }
  }
}

/**
 * AI Conflict Detection Service
 * 
 * This service implements a basic AI conflict detection algorithm
 * to flag conflicts between documents or content sections.
 * 
 * In a production environment, this would integrate with an
 * actual NLP or AI service.
 */
export class ConflictDetectionService {
  /**
   * Detect conflicts between document content sections
   * @param contentA First content section
   * @param contentB Second content section
   * @returns Array of detected conflicts
   */
  detectConflicts(contentA: string, contentB: string): Array<{
    type: 'duplicate_content' | 'conflicting_perspective';
    description: string;
    sections: string[];
  }> {
    const conflicts: Array<{
      type: 'duplicate_content' | 'conflicting_perspective';
      description: string;
      sections: string[];
    }> = [];
    
    // This is a very basic implementation for demonstration purposes
    
    // Check for duplicate content (exact matches)
    const paragraphsA = contentA.split('\n\n');
    const paragraphsB = contentB.split('\n\n');
    
    // Compare paragraphs for exact matches (simulating duplicate content detection)
    for (const paraA of paragraphsA) {
      if (paraA.length > 50 && paragraphsB.includes(paraA)) {
        conflicts.push({
          type: 'duplicate_content',
          description: 'Duplicate paragraph detected',
          sections: [paraA],
        });
      }
    }
    
    // Simulating conflicting perspective detection
    // In a real implementation, this would use NLP to detect contradictory statements
    const keywordsA = this.extractKeywords(contentA);
    const keywordsB = this.extractKeywords(contentB);
    
    // Check for opposite sentiment keywords (very simplified approach)
    const oppositeKeywords = [
      ['support', 'oppose'],
      ['agree', 'disagree'],
      ['approve', 'disapprove'],
      ['increase', 'decrease'],
      ['positive', 'negative'],
    ];
    
    for (const [positive, negative] of oppositeKeywords) {
      if (
        (keywordsA.includes(positive) && keywordsB.includes(negative)) ||
        (keywordsA.includes(negative) && keywordsB.includes(positive))
      ) {
        conflicts.push({
          type: 'conflicting_perspective',
          description: `Potentially conflicting positions: "${positive}" vs "${negative}"`,
          sections: this.findSentencesWithKeywords(
            [contentA, contentB],
            [positive, negative]
          ),
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Extract keywords from text (simplified implementation)
   * @param text The text to extract keywords from
   * @returns Array of extracted keywords
   */
  private extractKeywords(text: string): string[] {
    // This is a simplified implementation.
    // In a real app, you would use a proper NLP library for keyword extraction.
    const words = text.toLowerCase().split(/\W+/);
    return Array.from(new Set(words.filter(word => word.length > 3)));
  }
  
  /**
   * Find sentences containing specific keywords
   * @param texts Array of text blocks to search in
   * @param keywords Keywords to search for
   * @returns Array of sentences containing the keywords
   */
  private findSentencesWithKeywords(texts: string[], keywords: string[]): string[] {
    const sentences: string[] = [];
    
    // Split texts into sentences and find those containing keywords
    for (const text of texts) {
      const textSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      for (const sentence of textSentences) {
        for (const keyword of keywords) {
          if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
            sentences.push(sentence.trim());
            break;
          }
        }
      }
    }
    
    return sentences;
  }
}

// Create singleton instances for use throughout the application
export const googleDriveService = new GoogleDriveService();
export const conflictDetectionService = new ConflictDetectionService();

// Add TypeScript interfaces for Google API windows references
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
} 