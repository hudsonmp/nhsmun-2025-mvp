'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/lib/context/AuthGuard';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase, documentAPI } from '@/lib/supabase';
import { googleDriveService } from '@/lib/googleDrive';
import { DocumentType, CommitteeType, FileType, DocumentUploadMetadata } from '@/lib/document';
import { toast } from 'react-hot-toast';

// List of supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.google-apps.document': 'gdoc',
};

// Committees and types from the Document type
const COMMITTEES: CommitteeType[] = ['UNSC', 'UNHRC', 'UNEP', 'DISEC', 'WHO', 'ECOSOC'];
const DOCUMENT_TYPES: DocumentType[] = ['position_paper', 'resolution', 'speech', 'research'];

// SyncStatusIndicator component for showing various sync states
const SyncStatusIndicator = ({ 
  status, 
  lastSynced 
}: { 
  status: string | undefined, 
  lastSynced: string | undefined 
}) => {
  // Function to format the last synced date
  const formatLastSynced = (date: string | undefined) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Render based on sync status
  switch (status) {
    case 'synced':
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            Synced with Google Docs
            {lastSynced && <span className="block text-xs text-gray-500">Last synced: {formatLastSynced(lastSynced)}</span>}
          </span>
        </div>
      );
    
    case 'syncing':
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Syncing with Google Docs...</span>
        </div>
      );
    
    case 'conflict':
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            Sync conflict detected
            {lastSynced && <span className="block text-xs text-gray-500">Last attempted: {formatLastSynced(lastSynced)}</span>}
          </span>
        </div>
      );
    
    case 'error':
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>
            Sync error
            <span className="block text-xs">Please try again or contact support</span>
          </span>
        </div>
      );
    
    default:
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1zm2-1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
          </svg>
          <span>Not synced with Google Docs</span>
        </div>
      );
  }
};

export default function UploadPage() {
  const router = useRouter();
  const { user, isGoogleDriveAuthenticated, isGoogleDriveLoading, authenticateGoogleDrive, initializeGoogleDrive } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for upload form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('position_paper');
  const [committee, setCommittee] = useState<CommitteeType>('UNSC');
  const [country, setCountry] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [useGoogleDrive, setUseGoogleDrive] = useState(false);
  
  // Upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [createdDocumentId, setCreatedDocumentId] = useState<string | null>(null);
  
  // Sync status tracking
  const [syncStatus, setSyncStatus] = useState<string | undefined>(undefined);
  const [lastSynced, setLastSynced] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Add these state variables at the top of the component
  const [isGoogleDocsModalOpen, setIsGoogleDocsModalOpen] = useState(false);
  const [googleDocsList, setGoogleDocsList] = useState<Array<{
    id: string;
    name: string;
    modifiedTime?: string;
    webViewLink?: string;
    mimeType?: string;
  }>>([]);
  const [selectedGoogleDoc, setSelectedGoogleDoc] = useState<string | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if file type is supported
    const fileType = SUPPORTED_FILE_TYPES[selectedFile.type as keyof typeof SUPPORTED_FILE_TYPES];
    if (!fileType) {
      setUploadError(`Unsupported file type: ${selectedFile.type}. Please upload a PDF, DOCX, or Google Doc.`);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setUploadError(null);
  };
  
  // Handle Google Drive authentication
  const handleGoogleDriveAuth = async () => {
    try {
      const authenticated = await authenticateGoogleDrive();
      if (authenticated) {
        setUseGoogleDrive(true);
        toast.success('Successfully authenticated with Google Drive');
      } else {
        toast.error('Failed to authenticate with Google Drive');
      }
    } catch (error: any) {
      console.error('Google Drive authentication error:', error);
      toast.error(`Google Drive authentication failed: ${error.message}`);
    }
  };
  
  // Add this function to handle Google Docs loading
  const handleGoogleDocsImport = async () => {
    setIsLoadingDocs(true);
    try {
      // Check if already authenticated, if not, authenticate
      if (!isGoogleDriveAuthenticated) {
        const authenticated = await authenticateGoogleDrive();
        if (!authenticated) {
          throw new Error('Failed to authenticate with Google Drive. Please connect Google Drive to your MUN Connect profile first.');
        }
      }
      
      // Query specifically for Google Docs from the user's drive
      const docs = await googleDriveService.listDriveFiles('mimeType = "application/vnd.google-apps.document"');
      
      if (docs.length === 0) {
        toast('No Google Docs found in your account. You might need to create one first.', {
          icon: '🔍'
        });
      }
      
      console.log('Found Google Docs:', docs);
      setGoogleDocsList(docs);
      setIsGoogleDocsModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load Google Docs:', error);
      toast.error(`Failed to load Google Docs: ${error.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };
  
  // Add this function to handle document selection
  const handleGoogleDocSelect = async (docId: string) => {
    try {
      const doc = googleDocsList.find(d => d.id === docId);
      if (!doc) return;
      
      console.log('Selected Google Doc:', doc);
      
      setTitle(doc.name);
      setUseGoogleDrive(true);
      // Store the selected doc ID for later use during form submission
      setSelectedGoogleDoc(docId);
      setIsGoogleDocsModalOpen(false);
      toast.success('Google Doc selected successfully');
    } catch (error: any) {
      console.error('Failed to select Google Doc:', error);
      toast.error(`Failed to select Google Doc: ${error.message}`);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file && !useGoogleDrive) {
      setUploadError('Please select a file to upload or enable Google Drive integration');
      return;
    }
    
    if (!title || !type || !committee || !country || !topic) {
      setUploadError('Please fill in all required fields');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setSyncStatus(undefined);
    setLastSynced(undefined);
    
    try {
      // Create document metadata
      const metadata: DocumentUploadMetadata = {
        title,
        type,
        committee,
        country,
        topic,
        create_google_doc: useGoogleDrive
      };
      
      // Step 1: Create document in Supabase
      const document = await documentAPI.createDocument(metadata);
      setCreatedDocumentId(document.id);
      setUploadProgress(20);
      
      // Step 2: Handle file upload
      if (file) {
        // Generate signed URL for file upload
        const uploadUrl = await documentAPI.getUploadUrl(document.id, file.name, file.type);
        setUploadProgress(40);
        
        // Upload file to Supabase Storage
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload file: ${response.statusText}`);
        }
        
        setUploadProgress(70);
      }
      
      // Step 3: Handle Google Drive integration
      if (useGoogleDrive) {
        try {
          setIsSyncing(true);
          setSyncStatus('syncing');
          
          // Check if already authenticated, if not, authenticate
          if (!isGoogleDriveAuthenticated) {
            const authenticated = await authenticateGoogleDrive();
            if (!authenticated) {
              throw new Error('Failed to authenticate with Google Drive. Please connect Google Drive to your MUN Connect profile first.');
            }
          }
          
          // Use selected Google Doc if available, otherwise create new one
          let googleDocId;
          if (selectedGoogleDoc) {
            googleDocId = selectedGoogleDoc;
          } else {
            // Create new Google Doc
            const googleDocResponse = await googleDriveService.createGoogleDoc({
              ...document,
              user: {
                id: user?.id || '',
                email: user?.email || '',
                username: user?.email || 'unknown',
                name: user?.email?.split('@')[0] || 'Unknown User'
              }
            });
            
            // Get current timestamp for last synced
            const syncTimestamp = new Date().toISOString();
            
            // Update document with Google Doc ID
            await documentAPI.updateDocument(document.id, {
              drive_file_id: googleDocResponse.id,
              drive_web_link: googleDocResponse.webViewLink,
              format_status: 'pending',
              sync_status: 'synced',
              last_synced: syncTimestamp
            });
            
            setSyncStatus('synced');
            setLastSynced(syncTimestamp);
            setIsSyncing(false);
            
            setUploadProgress(100);
            setUploadSuccess(true);
            toast.success('Document created successfully');
          }
        } catch (error: any) {
          setSyncStatus('error');
          setIsSyncing(false);
          console.error('Google Drive error:', error);
          toast.error(`Google Drive error: ${error.message}`);
          throw error;
        }
      } else {
        setUploadProgress(100);
        setUploadSuccess(true);
        toast.success('Document uploaded successfully');
      }
      
    } catch (error: any) {
      console.error('Document upload error:', error);
      setUploadError(`Upload failed: ${error.message}`);
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header with breadcrumb navigation */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                Home
              </Link>
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link href="/repository" className="text-blue-600 hover:text-blue-700">
                Repository
              </Link>
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 font-medium">Upload</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Upload Document
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Upload a new document to the repository
              </p>
            </div>
          </div>

          {/* Upload form */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {uploadSuccess ? (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Successful</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your document has been uploaded successfully.
                  </p>
                  
                  {syncStatus && (
                    <div className="mt-4 flex justify-center">
                      <SyncStatusIndicator status={syncStatus} lastSynced={lastSynced} />
                    </div>
                  )}
                  
                  <div className="mt-6 space-y-4">
                    <Link
                      href="/repository"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Go to Repository
                    </Link>
                    
                    {createdDocumentId && (
                      <div className="flex justify-center mt-2">
                        <Link
                          href={`/repository/document/${createdDocumentId}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Document
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Document Details Section */}
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Document Details</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      {/* Title */}
                      <div className="sm:col-span-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Document Type */}
                      <div className="sm:col-span-3">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Document Type <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <select
                            id="type"
                            name="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as DocumentType)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            {DOCUMENT_TYPES.map((docType) => (
                              <option key={docType} value={docType}>
                                {docType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Committee */}
                      <div className="sm:col-span-3">
                        <label htmlFor="committee" className="block text-sm font-medium text-gray-700">
                          Committee <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <select
                            id="committee"
                            name="committee"
                            value={committee}
                            onChange={(e) => setCommittee(e.target.value as CommitteeType)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          >
                            {COMMITTEES.map((com) => (
                              <option key={com} value={com}>{com}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Country */}
                      <div className="sm:col-span-3">
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="country"
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Topic */}
                      <div className="sm:col-span-6">
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                          Topic <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="topic"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* File Upload Section */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Document File</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload your document file or use Google Drive integration.
                    </p>
                    
                    <div className="mt-6">
                      {/* File Upload */}
                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">
                          Upload File
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  disabled={isUploading || useGoogleDrive}
                                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF or DOCX up to 10MB
                            </p>
                            
                            {file && (
                              <div className="mt-2 flex items-center text-sm text-gray-800">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Google Drive Integration */}
                      <div className="mt-6">
                        <div className="flex flex-col space-y-4">
                          <button
                            type="button"
                            onClick={handleGoogleDocsImport}
                            disabled={isUploading || isGoogleDriveLoading || !isGoogleDriveAuthenticated}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300"
                          >
                            {isLoadingDocs ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading Docs...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                </svg>
                                Import from Google Drive
                              </>
                            )}
                          </button>

                          {selectedGoogleDoc && (
                            <div className="flex items-center text-sm text-green-600">
                              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Google Doc selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {uploadError && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{uploadError}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress bar */}
                  {isUploading && (
                    <div>
                      <h4 className="sr-only">Status</h4>
                      <div className="mt-6" aria-hidden="true">
                        <div className="bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-sm font-medium text-gray-600">
                          <div>Uploading...</div>
                          <div>{uploadProgress}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Form actions */}
                  <div className="pt-5 border-t border-gray-200">
                    <div className="flex justify-end">
                      <Link
                        href="/repository"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {isUploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : 'Upload Document'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Google Docs Selection Modal */}
      {isGoogleDocsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Improved modal with dynamic background */}
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              style={{
                backgroundImage: `
                  linear-gradient(120deg, rgba(59, 130, 246, 0.05) 0%, rgba(253, 230, 138, 0.08) 25%, rgba(101, 163, 213, 0.08) 50%, rgba(190, 144, 99, 0.06) 75%, rgba(59, 130, 246, 0.04) 100%)
                `,
                backgroundSize: '400% 400%',
                animation: 'gradientBG 15s ease infinite'
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    @keyframes gradientBG {
                      0% { background-position: 0% 50% }
                      50% { background-position: 100% 50% }
                      100% { background-position: 0% 50% }
                    }
                  `
                }}
              />
              
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Select a Google Document
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose from your Google Drive documents to import
                    </p>
                  </div>
                </div>
                
                {/* Search input */}
                <div className="mt-4 relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search documents..."
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      if (query === '') {
                        setGoogleDocsList(googleDocsList);
                      } else {
                        const filtered = googleDocsList.filter(doc => 
                          doc.name.toLowerCase().includes(query)
                        );
                        setGoogleDocsList(filtered);
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Document list */}
                <div className="mt-6 max-h-96 overflow-y-auto pr-1">
                  {isLoadingDocs ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4 text-sm text-gray-500">Loading your Google Docs...</p>
                    </div>
                  ) : googleDocsList.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You have no Google Docs or none match your search criteria.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              // Create new Google Doc
                              const newDocId = await googleDriveService.createGoogleDoc({
                                id: 'temp',
                                title: 'New Document',
                                type: 'position_paper',
                                committee: 'UNSC',
                                country: 'United States',
                                topic: 'Climate Change',
                                created_at: new Date().toISOString(),
                                user: {
                                  id: user?.id || '',
                                  email: user?.email || '',
                                  username: user?.email || 'unknown',
                                  name: user?.email?.split('@')[0] || 'Unknown User'
                                },
                                format_status: 'not_checked'
                              });
                              
                              // Open the doc in a new tab
                              window.open(`https://docs.google.com/document/d/${newDocId}/edit`, '_blank');
                              
                              // Refresh the doc list
                              handleGoogleDocsImport();
                              
                              toast.success('New Google Doc created!');
                            } catch (error: any) {
                              console.error('Failed to create Google Doc:', error);
                              toast.error(`Failed to create Google Doc: ${error.message}`);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Create New Google Doc
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {googleDocsList.map((doc) => (
                        <li key={doc.id} className="py-4">
                          <div className="flex items-center space-x-4 hover:bg-blue-50 p-2 rounded-md transition-colors duration-200">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded bg-blue-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Last modified: {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : 'Unknown'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleGoogleDocSelect(doc.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Select
                              </button>
                              {doc.webViewLink && (
                                <a
                                  href={doc.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Modal footer */}
                <div className="mt-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setIsGoogleDocsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleDocsImport}
                    className="ml-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Docs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
