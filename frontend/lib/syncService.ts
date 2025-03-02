import { supabase, documentAPI } from './supabase';
import { googleDriveService, conflictDetectionService } from './googleDrive';
import { Document, DocumentConflict } from './document';

/**
 * Document Sync Service
 * 
 * This service handles real-time document synchronization between
 * Supabase and Google Drive, including:
 * 
 * 1. Polling for changes in Google Drive documents
 * 2. Updating Supabase when Google Drive documents change
 * 3. Using the conflict detection service to detect and flag conflicts
 * 4. Managing the synchronization status of documents
 */
export class DocumentSyncService {
  private syncIntervals: Record<string, number> = {};
  private readonly syncInterval = 5000; // 5 seconds
  
  /**
   * Start syncing a document
   * @param documentId The ID of the document to sync
   */
  startSync(documentId: string): void {
    // Check if already syncing
    if (this.syncIntervals[documentId]) {
      console.log(`Already syncing document ${documentId}`);
      return;
    }
    
    console.log(`Starting sync for document ${documentId}`);
    
    // Start sync interval
    this.syncIntervals[documentId] = window.setInterval(
      () => this.syncDocument(documentId),
      this.syncInterval
    );
  }
  
  /**
   * Stop syncing a document
   * @param documentId The ID of the document to stop syncing
   */
  stopSync(documentId: string): void {
    if (!this.syncIntervals[documentId]) {
      console.log(`Document ${documentId} is not being synced`);
      return;
    }
    
    console.log(`Stopping sync for document ${documentId}`);
    
    // Clear interval
    clearInterval(this.syncIntervals[documentId]);
    delete this.syncIntervals[documentId];
  }
  
  /**
   * Sync a document between Supabase and Google Drive
   * @param documentId The ID of the document to sync
   */
  private async syncDocument(documentId: string): Promise<void> {
    try {
      console.log(`Syncing document ${documentId}`);
      
      // Get document from Supabase
      const document = await documentAPI.getDocument(documentId);
      
      if (!document) {
        console.error(`Document ${documentId} not found`);
        this.stopSync(documentId);
        return;
      }
      
      // If no Google Doc ID, nothing to sync
      if (!document.drive_file_id) {
        console.log(`Document ${documentId} has no Google Doc ID, skipping sync`);
        this.stopSync(documentId);
        return;
      }
      
      // Update sync status to pending
      await documentAPI.updateDocument(documentId, {
        sync_status: 'pending',
      });
      
      // Get Google Doc content
      const googleDoc = await this.getGoogleDocContent(document.drive_file_id);
      
      // Check for conflicts
      if (document.content && googleDoc) {
        const conflicts = this.detectConflicts(document.content, googleDoc);
        
        if (conflicts.length > 0) {
          console.log(`Conflicts detected in document ${documentId}`);
          await this.handleConflicts(documentId, conflicts);
          
          // Update sync status to conflict
          await documentAPI.updateDocument(documentId, {
            sync_status: 'conflict',
            last_synced: new Date().toISOString(),
          });
          
          return;
        }
      }
      
      // Update document content if Google Doc has content
      if (googleDoc) {
        await documentAPI.updateDocument(documentId, {
          content: googleDoc,
          updated_at: new Date().toISOString(),
          sync_status: 'synced',
          last_synced: new Date().toISOString(),
        });
        
        console.log(`Document ${documentId} synced from Google Drive`);
      }
    } catch (error) {
      console.error(`Error syncing document ${documentId}:`, error);
      
      // Update sync status to error
      await documentAPI.updateDocument(documentId, {
        sync_status: 'error',
        last_synced: new Date().toISOString(),
      });
    }
  }
  
  /**
   * Get Google Doc content
   * @param googleDocId The ID of the Google Doc
   * @returns The content of the Google Doc as plain text
   */
  private async getGoogleDocContent(googleDocId: string): Promise<string | null> {
    try {
      // Check if Google Drive service is authenticated
      if (!googleDriveService.isAuthenticated()) {
        console.warn('Google Drive service not authenticated');
        return null;
      }
      
      // Export the Google Doc as plain text
      const exportUrl = await googleDriveService.exportGoogleDoc(googleDocId, 'text/plain');
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to export Google Doc: ${response.statusText}`);
      }
      
      const content = await response.text();
      return content;
    } catch (error) {
      console.error(`Error getting Google Doc content:`, error);
      return null;
    }
  }
  
  /**
   * Detect conflicts between document versions
   * @param supabaseContent The content from Supabase
   * @param googleDocContent The content from Google Drive
   * @returns Array of detected conflicts
   */
  private detectConflicts(supabaseContent: string, googleDocContent: string): Array<{
    type: 'duplicate_content' | 'conflicting_perspective';
    description: string;
    sections: string[];
  }> {
    return conflictDetectionService.detectConflicts(supabaseContent, googleDocContent);
  }
  
  /**
   * Handle detected conflicts
   * @param documentId The ID of the document with conflicts
   * @param conflicts The detected conflicts
   */
  private async handleConflicts(documentId: string, conflicts: Array<{
    type: 'duplicate_content' | 'conflicting_perspective';
    description: string;
    sections: string[];
  }>): Promise<void> {
    try {
      // Create a conflict record for each detected conflict
      for (const conflict of conflicts) {
        await supabase
          .from('document_conflicts')
          .insert({
            document_id: documentId,
            conflict_type: conflict.type,
            description: conflict.description,
            sections: conflict.sections,
            created_at: new Date().toISOString(),
            resolved: false,
          });
      }
    } catch (error) {
      console.error(`Error handling conflicts for document ${documentId}:`, error);
    }
  }
  
  /**
   * Push document content to Google Drive
   * @param documentId The ID of the document to push
   */
  async pushToGoogleDrive(documentId: string): Promise<boolean> {
    try {
      console.log(`Pushing document ${documentId} to Google Drive`);
      
      // Get document from Supabase
      const document = await documentAPI.getDocument(documentId);
      
      if (!document) {
        console.error(`Document ${documentId} not found`);
        return false;
      }
      
      // If no Google Doc ID, create a new Google Doc
      if (!document.drive_file_id) {
        console.log(`Document ${documentId} has no Google Doc ID, creating new Google Doc`);
        const googleDocId = await googleDriveService.createGoogleDoc(document);
        
        // Update document with Google Doc ID
        await documentAPI.updateDocument(documentId, {
          drive_file_id: googleDocId,
          sync_status: 'synced',
          last_synced: new Date().toISOString(),
        });
        
        document.drive_file_id = googleDocId;
      }
      
      // Update Google Doc content
      if (document.content) {
        await googleDriveService.updateGoogleDoc(document.drive_file_id, document.content);
        
        // Update sync status
        await documentAPI.updateDocument(documentId, {
          sync_status: 'synced',
          last_synced: new Date().toISOString(),
        });
        
        console.log(`Document ${documentId} pushed to Google Drive`);
        return true;
      } else {
        console.warn(`Document ${documentId} has no content to push`);
        return false;
      }
    } catch (error) {
      console.error(`Error pushing document ${documentId} to Google Drive:`, error);
      
      // Update sync status to error
      await documentAPI.updateDocument(documentId, {
        sync_status: 'error',
        last_synced: new Date().toISOString(),
      });
      
      return false;
    }
  }
  
  /**
   * Resolve a document conflict
   * @param documentId The ID of the document with conflicts
   * @param conflictId The ID of the conflict to resolve
   * @param useGoogleDoc Whether to use the Google Doc version to resolve the conflict
   */
  async resolveConflict(documentId: string, conflictId: string, useGoogleDoc: boolean): Promise<boolean> {
    try {
      console.log(`Resolving conflict ${conflictId} for document ${documentId}`);
      
      // Get document from Supabase
      const document = await documentAPI.getDocument(documentId);
      
      if (!document) {
        console.error(`Document ${documentId} not found`);
        return false;
      }
      
      // If no Google Doc ID, can't resolve conflict
      if (!document.drive_file_id) {
        console.error(`Document ${documentId} has no Google Doc ID, can't resolve conflict`);
        return false;
      }
      
      // Resolve conflict based on user choice
      if (useGoogleDoc) {
        // Use Google Doc version
        const googleDocContent = await this.getGoogleDocContent(document.drive_file_id);
        
        if (googleDocContent) {
          await documentAPI.updateDocument(documentId, {
            content: googleDocContent,
            updated_at: new Date().toISOString(),
          });
        } else {
          console.error(`Failed to get Google Doc content for document ${documentId}`);
          return false;
        }
      } else {
        // Use Supabase version (push to Google Drive)
        if (document.content) {
          await googleDriveService.updateGoogleDoc(document.drive_file_id, document.content);
        } else {
          console.error(`Document ${documentId} has no content to push to Google Drive`);
          return false;
        }
      }
      
      // Mark conflict as resolved
      await documentAPI.resolveConflict(conflictId);
      
      // Check if there are any other unresolved conflicts
      const conflicts = await documentAPI.getConflicts(documentId);
      const unresolvedConflicts = conflicts.filter(conflict => !conflict.resolved);
      
      // If no unresolved conflicts, update sync status to synced
      if (unresolvedConflicts.length === 0) {
        await documentAPI.updateDocument(documentId, {
          sync_status: 'synced',
          last_synced: new Date().toISOString(),
        });
      }
      
      console.log(`Conflict ${conflictId} for document ${documentId} resolved`);
      return true;
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId} for document ${documentId}:`, error);
      return false;
    }
  }
}

// Create a singleton instance for use throughout the application
export const documentSyncService = new DocumentSyncService(); 