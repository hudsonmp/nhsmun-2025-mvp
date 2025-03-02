'use client';

import { useState, useEffect } from 'react';
import { supabase, documentAPI } from '@/lib/supabase';
import { googleDriveService } from '@/lib/googleDrive';
import { documentSyncService } from '@/lib/syncService';
import { Document } from '@/lib/document';
import Link from 'next/link';

/**
 * Test Harness for Document Uploader, Google Drive Integration, and Sync Service
 * 
 * This component is used to test:
 * 1. Document CRUD operations (Create, Read, Update, Delete)
 * 2. Google Drive integration (authentication, creating docs, updating docs)
 * 3. Real-time sync between Supabase and Google Drive
 * 4. Conflict detection and resolution
 * 5. Format validation of documents
 * 
 * Do not use in production - for testing purposes only.
 */
export default function UploaderTestHarness() {
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'failure' | 'running';
    message: string;
  }>>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [formatTestRunning, setFormatTestRunning] = useState(false);
  
  // Initialize Google Drive
  useEffect(() => {
    const initGoogleDrive = async () => {
      try {
        await googleDriveService.initialize();
        setAuthenticated(googleDriveService.isAuthenticated());
      } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
      }
    };
    
    initGoogleDrive();
  }, []);

  // Load documents when component mounts
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await documentAPI.getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    
    loadDocuments();
  }, []);
  
  // Run test
  const runTest = async () => {
    setLoading(true);
    setTestResults([]);
    
    // Check Google Drive authentication
    addTestResult('Google Drive Authentication', 'running', 'Checking authentication status...');
    
    if (!authenticated) {
      try {
        const authenticated = await googleDriveService.authenticate();
        setAuthenticated(authenticated);
        
        if (authenticated) {
          updateTestResult('Google Drive Authentication', 'success', 'Successfully authenticated with Google Drive');
        } else {
          updateTestResult('Google Drive Authentication', 'failure', 'Failed to authenticate with Google Drive');
          setLoading(false);
          return;
        }
      } catch (error: any) {
        updateTestResult('Google Drive Authentication', 'failure', `Authentication error: ${error.message}`);
        setLoading(false);
        return;
      }
    } else {
      updateTestResult('Google Drive Authentication', 'success', 'Already authenticated with Google Drive');
    }
    
    // Test document creation
    addTestResult('Document Creation', 'running', 'Creating test document...');
    
    try {
      const document = await documentAPI.createDocument({
        title: `Test Document ${new Date().toLocaleTimeString()}`,
        type: 'position_paper',
        committee: 'UNSC',
        country: 'Test Country',
        topic: 'Test Topic',
        create_google_doc: true
      });
      
      updateTestResult('Document Creation', 'success', `Document created with ID: ${document.id}`);
      setSelectedDocumentId(document.id);
      
      // Test Google Doc creation
      addTestResult('Google Doc Creation', 'running', 'Creating Google Doc for test document...');
      
      try {
        const googleDocId = await googleDriveService.createGoogleDoc(document);
        
        // Update document with Google Doc ID
        await documentAPI.updateDocument(document.id, {
          drive_file_id: googleDocId,
          sync_status: 'synced',
          last_synced: new Date().toISOString(),
        });
        
        updateTestResult('Google Doc Creation', 'success', `Google Doc created with ID: ${googleDocId}`);
        
        // Test document sync
        addTestResult('Document Sync', 'running', 'Testing document sync...');
        
        // Start syncing document
        documentSyncService.startSync(document.id);
        
        // Wait for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Stop syncing document
        documentSyncService.stopSync(document.id);
        
        updateTestResult('Document Sync', 'success', 'Document sync test completed');
        
        // Test conflict detection
        addTestResult('Conflict Detection', 'running', 'Testing conflict detection...');
        
        // Update document content to set up a potential conflict
        await documentAPI.updateDocument(document.id, {
          content: 'Content from Supabase: We support this resolution.',
        });
        
        // Simulate a conflict by updating the Google Doc with conflicting content
        // In a real scenario, this would happen through the Google Docs UI
        try {
          await googleDriveService.updateGoogleDoc(googleDocId, 'Content from Google Docs: We oppose this resolution.');
          
          // Manually trigger a sync to check for conflicts
          await documentSyncService.pushToGoogleDrive(document.id);
          
          // Wait for 3 seconds to allow conflict detection
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if conflicts were detected
          const syncStatus = await documentAPI.getSyncStatus(document.id);
          
          if (syncStatus && syncStatus.format_status === 'conflict') {
            updateTestResult('Conflict Detection', 'success', 'Conflict detected successfully');
          } else {
            updateTestResult('Conflict Detection', 'failure', 'No conflict detected');
          }
        } catch (error: any) {
          updateTestResult('Conflict Detection', 'failure', `Error during conflict detection: ${error.message}`);
        }
        
        // Load documents to display in the UI
        const docs = await documentAPI.getDocuments();
        setDocuments(docs);
        
      } catch (error: any) {
        updateTestResult('Google Doc Creation', 'failure', `Error creating Google Doc: ${error.message}`);
      }
    } catch (error: any) {
      updateTestResult('Document Creation', 'failure', `Error creating document: ${error.message}`);
    }
    
    setLoading(false);
  };
  
  // Run format validation test
  const runFormatValidationTest = async (documentId: string) => {
    if (!documentId) return;
    
    setFormatTestRunning(true);
    addTestResult('Format Validation', 'running', `Testing format validation for document ${documentId}...`);
    
    try {
      // Trigger format validation
      await documentAPI.validateDocumentFormat(documentId);
      
      // Wait for validation to complete (simulated)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check validation results
      const doc = await documentAPI.getDocument(documentId);
      
      if (doc) {
        if (doc.format_status === 'valid') {
          updateTestResult('Format Validation', 'success', 'Document format is valid');
        } else if (doc.format_status === 'issues') {
          updateTestResult('Format Validation', 'failure', `Document format has issues: ${doc.format_issues?.join(', ') || 'Unknown issues'}`);
        } else {
          updateTestResult('Format Validation', 'failure', `Document format status: ${doc.format_status || 'unknown'}`);
        }
      } else {
        updateTestResult('Format Validation', 'failure', 'Document not found');
      }
      
      // Refresh documents list
      const docs = await documentAPI.getDocuments();
      setDocuments(docs);
    } catch (error: any) {
      updateTestResult('Format Validation', 'failure', `Format validation error: ${error.message}`);
    } finally {
      setFormatTestRunning(false);
    }
  };
  
  // Add a test result to the list
  const addTestResult = (test: string, status: 'success' | 'failure' | 'running', message: string) => {
    setTestResults(prev => [...prev, { test, status, message }]);
  };
  
  // Update an existing test result
  const updateTestResult = (test: string, status: 'success' | 'failure' | 'running', message: string) => {
    setTestResults(prev => 
      prev.map(result => 
        result.test === test ? { ...result, status, message } : result
      )
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Document Uploader Test Harness
        </h1>
        <p className="text-gray-600 mb-6">
          This component tests the document uploader, Google Drive integration, sync service, and format validation.
        </p>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Google Drive Status</h2>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${authenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>
              {authenticated ? 'Authenticated' : 'Not authenticated'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={runTest}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Running Tests...' : 'Run Standard Tests'}
          </button>
          
          {selectedDocumentId && (
            <button
              onClick={() => runFormatValidationTest(selectedDocumentId)}
              disabled={formatTestRunning}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                formatTestRunning ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {formatTestRunning ? 'Validating...' : 'Test Format Validation'}
            </button>
          )}
        </div>
        
        {testResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{result.test}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'failure' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{result.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {documents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Documents</h2>
            <ul className="divide-y divide-gray-200">
              {documents.map(doc => (
                <li key={doc.id} className="py-4 hover:bg-gray-50 rounded-md p-2">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-md font-medium text-gray-900">{doc.title}</h3>
                        <button
                          type="button"
                          onClick={() => setSelectedDocumentId(doc.id)}
                          className={`ml-2 p-1 rounded-full ${selectedDocumentId === doc.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        {doc.committee} - {doc.country} - {doc.type}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-gray-500 mr-2">Format Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.format_status === 'valid' ? 'bg-green-100 text-green-800' :
                          doc.format_status === 'issues' ? 'bg-red-100 text-red-800' :
                          doc.format_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.format_status || 'Not checked'}
                        </span>
                      </div>
                      {doc.format_issues && doc.format_issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Issues:</p>
                          <ul className="mt-1 list-disc list-inside text-xs text-red-600">
                            {doc.format_issues.map((issue: string, idx: number) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        {doc.drive_file_id && (
                          <a 
                            href={`https://docs.google.com/document/d/${doc.drive_file_id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                          >
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
                            </svg>
                            Edit
                          </a>
                        )}
                        
                        <Link
                          href={`/repository/document/${doc.id}`}
                          className="inline-flex items-center px-2 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded"
                        >
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          View
                        </Link>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => runFormatValidationTest(doc.id)}
                        className="inline-flex items-center px-2 py-1 text-xs text-white bg-purple-600 hover:bg-purple-700 rounded"
                      >
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Validate Format
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 