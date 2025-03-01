'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsAPI } from '@/lib/api';
import { loadGoogleApi, isGoogleAuthenticated, signInWithGoogle, listDriveFiles, downloadDriveFile, checkGoogleDriveConfig } from '@/lib/googleDrive';

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('position_paper');
  const [committee, setCommittee] = useState('');
  const [country, setCountry] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [manualCredentialsModalOpen, setManualCredentialsModalOpen] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');
  const [manualClientId, setManualClientId] = useState('');

  // Mock committees and countries for the demo
  const committees = ['UNSC', 'UNHRC', 'UNEP', 'DISEC', 'WHO', 'ECOSOC'];
  const countries = ['United States', 'China', 'Russia', 'United Kingdom', 'France', 'Germany', 'India', 'Brazil', 'Sweden', 'South Africa', 'Japan', 'Mexico'];

  // Initialize Google API
  useEffect(() => {
    // Load Google API when component mounts
    const initGoogleApi = async () => {
      try {
        console.log('Initializing Google API...');
        
        // Check if we have credentials in session storage from a previous manual initialization
        const manualApiKey = sessionStorage.getItem('MANUAL_GOOGLE_API_KEY');
        const manualClientId = sessionStorage.getItem('MANUAL_GOOGLE_CLIENT_ID');
        
        // Use manual credentials if available
        const useManualCredentials = !!(manualApiKey && manualClientId);
        
        await loadGoogleApi(useManualCredentials);
        console.log('Google API initialized successfully');
        
        // Log additional information about authentication state
        if (window.gapi && window.gapi.auth2) {
          const authInstance = window.gapi.auth2.getAuthInstance();
          console.log('Authentication state after initialization:', {
            authInstanceExists: !!authInstance,
            isSignedIn: authInstance ? authInstance.isSignedIn.get() : false
          });
          
          // Add listener to track sign-in state changes
          if (authInstance) {
            authInstance.isSignedIn.listen((signedIn: boolean) => {
              console.log(`Google sign-in state changed: ${signedIn ? 'signed in' : 'signed out'}`);
            });
          }
        }
      } catch (error: any) {
        console.error('Error initializing Google API:', {
          message: error.message, 
          name: error.name,
          stack: error.stack,
          source: 'initGoogleApi useEffect'
        });
        setError(`Failed to initialize Google API: ${error.message || 'Unknown error'}`);
      }
    };

    initGoogleApi();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title || !committee || !country || !topic) {
      setError('Please fill all required fields');
      return;
    }
    
    if (!file && !selectedDriveFile) {
      setError('Please upload a file or select one from Google Drive');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', documentType);
      formData.append('committee', committee);
      formData.append('country', country);
      formData.append('topic', topic);
      
      if (file) {
        formData.append('file', file);
      } else if (selectedDriveFile) {
        formData.append('driveFileId', selectedDriveFile.id);
      }
      
      // In a real implementation, this would be a multipart/form-data request
      await documentsAPI.createDocument(formData);
      
      // Redirect to repository page after successful upload
      router.push('/repository');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const openGoogleDriveModal = () => {
    setShowGoogleDriveModal(true);
    fetchGoogleDriveFiles();
  };

  const fetchGoogleDriveFiles = async () => {
    setIsLoadingDriveFiles(true);
    setError('');
    
    try {
      // Check if Google API is loaded properly
      if (!window.gapi || !window.gapi.auth2) {
        console.log('Google API not fully loaded, initializing...');
        await loadGoogleApi();
      }
      
      // Check if signed in to Google
      if (!isGoogleAuthenticated()) {
        console.log('User not signed in to Google, showing sign-in prompt...');
        setError('Please sign in to Google to access your Drive files');
        
        // Create the auth instance if it doesn't exist
        if (!window.gapi.auth2.getAuthInstance()) {
          await new Promise((resolve) => {
            window.gapi.auth2.init({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            }).then(resolve);
          });
        }
        
        // Show the Google sign-in popup with explicit user interaction
        const user = await window.gapi.auth2.getAuthInstance().signIn({
          prompt: 'select_account', // Force account selection
          ux_mode: 'popup' // Use popup for better user experience
        });
        
        if (!user) {
          throw new Error('Google sign-in was cancelled or failed');
        }
        
        console.log('Successfully signed in to Google');
      }
      
      // Make sure Drive API is loaded
      if (!window.gapi.client.drive) {
        console.log('Loading Google Drive API...');
        await new Promise((resolve, reject) => {
          window.gapi.client.load('drive', 'v3', resolve);
        });
      }
      
      // Get files from Google Drive
      console.log('Fetching files from Google Drive...');
      const files = await listDriveFiles(driveSearchQuery);
      setGoogleDriveFiles(files as any[]);
      console.log('Successfully fetched Google Drive files');
    } catch (error: any) {
      // Detailed error logging
      console.error('Error fetching Google Drive files:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Show a more specific error message to the user
      setError(`Failed to access Google Drive: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const selectDriveFile = async (file: any) => {
    try {
      // For document formats, we may want to download the content
      if (file.mimeType.includes('document') || 
          file.mimeType.includes('pdf') || 
          file.mimeType.includes('text')) {
        
        const fileBlob = await downloadDriveFile(file.id);
        const newFile = new File([fileBlob], file.name, { type: file.mimeType });
        setFile(newFile);
      }
      
      setSelectedDriveFile(file);
      setShowGoogleDriveModal(false);
      
      // Auto-fill form fields based on file name if possible
      const fileName = file.name;
      
      // Try to extract information from file name
      // This is a simple implementation and would need to be more robust in a real app
      committees.forEach(comm => {
        if (fileName.includes(comm)) {
          setCommittee(comm);
        }
      });
      
      countries.forEach(ctry => {
        if (fileName.includes(ctry)) {
          setCountry(ctry);
        }
      });
      
      if (fileName.includes('Position Paper')) {
        setDocumentType('position_paper');
      } else if (fileName.includes('Resolution')) {
        setDocumentType('resolution');
      } else if (fileName.includes('Speech')) {
        setDocumentType('speech');
      }
    } catch (error) {
      console.error('Error selecting Drive file:', error);
      setError('Failed to retrieve file from Google Drive.');
    }
  };

  const filteredDriveFiles = driveSearchQuery 
    ? googleDriveFiles.filter(file => 
        file.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
      )
    : googleDriveFiles;

  // Add diagnostic function
  const runGoogleDriveDiagnostics = async () => {
    try {
      setError('Running diagnostics...');
      const diagnostics = await checkGoogleDriveConfig();
      console.log('Google Drive Diagnostics:', diagnostics);
      setDiagnosticResults(diagnostics);
      
      if (diagnostics.errors.length > 0) {
        setError(`Google Drive issues found: ${diagnostics.errors.join(', ')}`);
      } else {
        setError('Google Drive configuration looks good. Try signing out and in again.');
      }
    } catch (error: any) {
      console.error('Error running diagnostics:', error);
      setError(`Failed to run diagnostics: ${error.message}`);
    }
  };

  const initializeWithManualCredentials = useCallback(async () => {
    if (!manualApiKey || !manualClientId) {
      setError('Please provide both API Key and Client ID');
      return;
    }
    
    try {
      setError('Initializing with manual credentials...');
      
      // Store the current gapi state before resetting
      const currentGapi = window.gapi;
      
      // Reset gapi to force reinitialization
      window.gapi = undefined as any;
      
      // Store credentials in sessionStorage to make them available to googleDrive.ts
      sessionStorage.setItem('MANUAL_GOOGLE_API_KEY', manualApiKey);
      sessionStorage.setItem('MANUAL_GOOGLE_CLIENT_ID', manualClientId);
      
      // Re-initialize
      await loadGoogleApi(true); // Pass true to indicate using manual credentials
      
      // Run diagnostics
      const diagnostics = await checkGoogleDriveConfig();
      setDiagnosticResults(diagnostics);
      
      if (diagnostics.errors.length > 0) {
        setError(`Still have issues after manual initialization: ${diagnostics.errors.join(', ')}`);
      } else {
        setError('Manual initialization successful!');
        setManualCredentialsModalOpen(false);
      }
    } catch (error: any) {
      console.error('Error in manual initialization:', error);
      setError(`Manual initialization failed: ${error.message}`);
      // Restore old gapi if needed
      if (window.gapi === undefined) {
        window.gapi = {} as any;
      }
    }
  }, [manualApiKey, manualClientId]);

  // Add a new verification function
  const verifyGoogleAuthStatus = () => {
    const authDetails: any = {
      status: 'Checking authentication status...',
      gapiLoaded: false,
      auth2Loaded: false,
      authInstance: null,
      isSignedIn: false,
      currentUser: null,
      tokenInfo: null,
      errors: []
    };
    
    try {
      // Check if gapi is loaded
      authDetails.gapiLoaded = !!window.gapi;
      if (!authDetails.gapiLoaded) {
        authDetails.errors.push('Google API (gapi) is not loaded');
        authDetails.status = 'Failed - Google API not loaded';
        return authDetails;
      }
      
      // Check if auth2 is loaded
      authDetails.auth2Loaded = !!window.gapi.auth2;
      if (!authDetails.auth2Loaded) {
        authDetails.errors.push('Google Auth2 API is not loaded');
        authDetails.status = 'Failed - Auth2 API not loaded';
        return authDetails;
      }
      
      // Check if auth instance exists
      try {
        const authInstance = window.gapi.auth2.getAuthInstance();
        authDetails.authInstance = !!authInstance;
        
        if (!authInstance) {
          authDetails.errors.push('Google Auth instance does not exist');
          authDetails.status = 'Failed - No auth instance';
          return authDetails;
        }
        
        // Check if user is signed in
        authDetails.isSignedIn = authInstance.isSignedIn.get();
        
        if (!authDetails.isSignedIn) {
          authDetails.errors.push('User is not signed in to Google');
          authDetails.status = 'Failed - Not signed in';
          return authDetails;
        }
        
        // Get user information
        const currentUser = authInstance.currentUser.get();
        const profile = currentUser.getBasicProfile();
        authDetails.currentUser = {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          scopes: currentUser.getGrantedScopes()
        };
        
        // Check if token exists
        try {
          const token = window.gapi.auth.getToken();
          authDetails.tokenInfo = {
            exists: !!token,
            accessToken: token ? `${token.access_token.substring(0, 10)}...` : null,
            expiresAt: token ? new Date(token.expires_at).toISOString() : null,
            expiresIn: token ? Math.floor((token.expires_at - Date.now()) / 1000) : null
          };
          
          if (!token || !token.access_token) {
            authDetails.errors.push('No valid auth token found');
          } else if (token.expires_at < Date.now()) {
            authDetails.errors.push('Auth token has expired');
          }
        } catch (e: any) {
          authDetails.errors.push(`Error checking token: ${e.message}`);
        }
        
        // Check if user has necessary scopes
        const requiredScopes = [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.readonly'
        ];
        
        const missingScopes = requiredScopes.filter(scope => 
          !authDetails.currentUser.scopes.includes(scope)
        );
        
        if (missingScopes.length > 0) {
          authDetails.errors.push(`Missing required scopes: ${missingScopes.join(', ')}`);
        }
        
        authDetails.status = authDetails.errors.length === 0 ? 
          'Success - Fully authenticated' : 
          'Partial - Authentication issues found';
          
      } catch (e: any) {
        authDetails.errors.push(`Error accessing auth instance: ${e.message}`);
        authDetails.status = 'Failed - Auth instance error';
      }
    } catch (e: any) {
      authDetails.errors.push(`Unexpected error: ${e.message}`);
      authDetails.status = 'Failed - Unexpected error';
    }
    
    console.log('Google Auth Verification:', authDetails);
    return authDetails;
  };

  // Enhance sign-in function to provide more details
  const signInToGoogleExplicitly = async () => {
    setError('');
    try {
      console.log('Starting explicit Google sign-in process...');
      
      // Make sure API is loaded
      if (!window.gapi || !window.gapi.auth2) {
        console.log('Google API not fully loaded, initializing...');
        await loadGoogleApi();
      }
      
      // Log pre-auth state
      console.log('Pre-auth state:', verifyGoogleAuthStatus());
      
      // Create the auth instance if it doesn't exist
      if (!window.gapi.auth2.getAuthInstance()) {
        console.log('Auth instance does not exist, creating...');
        await new Promise((resolve, reject) => {
          window.gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          }).then(resolve).catch(reject);
        });
      }
      
      // Show the Google sign-in popup with all options explicitly set
      console.log('Showing Google sign-in popup...');
      const googleUser = await window.gapi.auth2.getAuthInstance().signIn({
        prompt: 'select_account', // Force account selection
        ux_mode: 'popup', // Use popup for better user experience
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'
      });
      
      // Log successful sign-in details
      if (googleUser) {
        const profile = googleUser.getBasicProfile();
        console.log('Successfully signed in to Google as:', {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl()
        });
      }
      
      // Log post-auth state
      const postAuthState = verifyGoogleAuthStatus();
      console.log('Post-auth state:', postAuthState);
      setDiagnosticResults(postAuthState);
      
      // Refresh the list of files if authentication is successful
      if (postAuthState.isSignedIn) {
        fetchGoogleDriveFiles();
      } else {
        throw new Error('Sign-in process completed but user is still not signed in');
      }
    } catch (error: any) {
      console.error('Error signing in to Google:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setError(`Failed to sign in to Google: ${error.message || 'Unknown error'}`);
      
      // Run diagnostics even on error
      setDiagnosticResults(verifyGoogleAuthStatus());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
          <Link href="/repository" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Return to Repository
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Document Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please fill in the details for your document
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="document-type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="position_paper">Position Paper</option>
                  <option value="resolution">Resolution</option>
                  <option value="speech">Speech</option>
                  <option value="research">Research Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="committee" className="block text-sm font-medium text-gray-700 mb-1">
                  Committee <span className="text-red-500">*</span>
                </label>
                <select
                  id="committee"
                  value={committee}
                  onChange={(e) => setCommittee(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Committee</option>
                  {committees.map((comm) => (
                    <option key={comm} value={comm}>{comm}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((ctry) => (
                    <option key={ctry} value={ctry}>{ctry}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h4>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".doc,.docx,.pdf,.txt"
                    />
                    
                    {file ? (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Selected file:</span>
                        <span className="text-base font-medium text-blue-600">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="ml-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:text-blue-500"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Click to upload
                          </button>{' '}
                          or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500">DOC, DOCX, PDF or TXT up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="relative flex items-center">
                    <div className="flex h-5 items-center">
                      <span className="text-sm font-medium text-gray-900">or</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={openGoogleDriveModal}
                    className="w-full flex justify-center items-center px-4 py-8 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {selectedDriveFile ? (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Selected from Google Drive:</span>
                        <span className="text-base font-medium text-blue-600">{selectedDriveFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriveFile(null);
                          }}
                          className="ml-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 87.3 78" className="w-6 h-6 mr-2">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                        </svg>
                        Select from Google Drive
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <Link
                href="/repository"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Google Drive file picker modal */}
      {showGoogleDriveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Select a file from Google Drive
                    </h3>
                    <div className="mt-4">
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={driveSearchQuery}
                          onChange={(e) => setDriveSearchQuery(e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      {!isGoogleAuthenticated() && (
                        <div className="mb-4 flex justify-center">
                          <button
                            type="button"
                            onClick={signInToGoogleExplicitly}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                              <path
                                fill="#FFFFFF"
                                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                              />
                            </svg>
                            Sign in to Google Drive
                          </button>
                        </div>
                      )}
                      
                      {isLoadingDriveFiles ? (
                        <div className="flex justify-center py-6">
                          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <>
                          {/* Verification Button */}
                          <div className="flex justify-end mb-4">
                            <button
                              type="button"
                              onClick={() => setDiagnosticResults(verifyGoogleAuthStatus())}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Verify Auth Status
                            </button>
                          </div>
                          
                          {/* Show diagnostic results if available */}
                          {diagnosticResults && (
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs">
                              <h4 className="font-medium mb-1">Auth Diagnostics:</h4>
                              <div className="space-y-1">
                                <p><span className="font-medium">Status:</span> {diagnosticResults.status}</p>
                                <p><span className="font-medium">Google API Loaded:</span> {diagnosticResults.gapiLoaded ? '✓' : '❌'}</p>
                                <p><span className="font-medium">Auth2 Loaded:</span> {diagnosticResults.auth2Loaded ? '✓' : '❌'}</p>
                                <p><span className="font-medium">Auth Instance:</span> {diagnosticResults.authInstance ? '✓' : '❌'}</p>
                                <p><span className="font-medium">Signed In:</span> {diagnosticResults.isSignedIn ? '✓' : '❌'}</p>
                                
                                {diagnosticResults.currentUser && (
                                  <div>
                                    <p><span className="font-medium">User:</span> {diagnosticResults.currentUser.name} ({diagnosticResults.currentUser.email})</p>
                                  </div>
                                )}
                                
                                {diagnosticResults.tokenInfo && (
                                  <div>
                                    <p><span className="font-medium">Token:</span> {diagnosticResults.tokenInfo.exists ? '✓' : '❌'}</p>
                                    {diagnosticResults.tokenInfo.expiresIn && (
                                      <p><span className="font-medium">Expires:</span> {diagnosticResults.tokenInfo.expiresIn} seconds</p>
                                    )}
                                  </div>
                                )}
                                
                                {diagnosticResults.errors && diagnosticResults.errors.length > 0 && (
                                  <div className="mt-1">
                                    <p className="font-medium text-red-600">Errors:</p>
                                    <ul className="list-disc pl-4 text-red-600">
                                      {diagnosticResults.errors.map((err: string, i: number) => (
                                        <li key={i}>{err}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            {filteredDriveFiles.length > 0 ? (
                              <ul className="divide-y divide-gray-200">
                                {filteredDriveFiles.map((file) => (
                                  <li key={file.id} className="px-4 py-3 hover:bg-gray-50">
                                    <button
                                      type="button"
                                      className="w-full text-left"
                                      onClick={() => selectDriveFile(file)}
                                    >
                                      <div className="flex items-center">
                                        <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                          <p className="text-xs text-gray-500">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="px-4 py-6 text-center text-gray-500">
                                No files found matching your search
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-green-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setManualCredentialsModalOpen(true)}
                >
                  Manual Credentials
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-blue-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={runGoogleDriveDiagnostics}
                >
                  Run Diagnostics
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowGoogleDriveModal(false)}
                >
                  Cancel
                </button>
              </div>
              {diagnosticResults && (
                <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 max-h-60 overflow-auto">
                  <h3 className="text-lg font-medium text-gray-900">Diagnostic Results</h3>
                  <div className="mt-2">
                    <h4 className="font-medium">Configuration Status:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      <li>API Key: {diagnosticResults.configStatus.apiKey}</li>
                      <li>Client ID: {diagnosticResults.configStatus.clientId}</li>
                    </ul>
                    
                    <h4 className="font-medium mt-2">API Status:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      <li>GAPI Loaded: {diagnosticResults.apiStatus.gapiLoaded ? '✅' : '❌'}</li>
                      <li>Client Loaded: {diagnosticResults.apiStatus.clientLoaded ? '✅' : '❌'}</li>
                      <li>Auth Loaded: {diagnosticResults.apiStatus.authLoaded ? '✅' : '❌'}</li>
                      <li>Drive Loaded: {diagnosticResults.apiStatus.driveLoaded ? '✅' : '❌'}</li>
                      <li>Signed In: {diagnosticResults.apiStatus.isSignedIn ? '✅' : '❌'}</li>
                      {diagnosticResults.apiStatus.user && (
                        <li>User: {diagnosticResults.apiStatus.user.name} ({diagnosticResults.apiStatus.user.email})</li>
                      )}
                      {diagnosticResults.apiStatus.hasValidToken !== undefined && (
                        <li>Valid Token: {diagnosticResults.apiStatus.hasValidToken ? '✅' : '❌'}</li>
                      )}
                      {diagnosticResults.apiStatus.tokenExpiry && (
                        <li>Token Expiry: {diagnosticResults.apiStatus.tokenExpiry}</li>
                      )}
                      {diagnosticResults.apiStatus.hasFileScope !== undefined && (
                        <li>Has Drive File Scope: {diagnosticResults.apiStatus.hasFileScope ? '✅' : '❌'}</li>
                      )}
                      {diagnosticResults.apiStatus.hasReadScope !== undefined && (
                        <li>Has Drive Read Scope: {diagnosticResults.apiStatus.hasReadScope ? '✅' : '❌'}</li>
                      )}
                    </ul>
                    
                    {diagnosticResults.apiTests && (
                      <>
                        <h4 className="font-medium mt-2">API Tests:</h4>
                        <ul className="list-disc pl-5 text-sm text-gray-600">
                          {diagnosticResults.apiTests.listFilesSuccess !== undefined && (
                            <li>List Files Test: {diagnosticResults.apiTests.listFilesSuccess ? '✅ Success' : '❌ Failed'}</li>
                          )}
                          {diagnosticResults.apiTests.listFilesError && (
                            <li>Error: {diagnosticResults.apiTests.listFilesError.message}</li>
                          )}
                        </ul>
                      </>
                    )}
                    
                    {diagnosticResults.errors.length > 0 && (
                      <>
                        <h4 className="font-medium mt-2 text-red-600">Errors:</h4>
                        <ul className="list-disc pl-5 text-sm text-red-600">
                          {diagnosticResults.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {manualCredentialsModalOpen && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Manual Google API Credentials
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your Google API credentials manually. This can help if your environment variables aren't being loaded correctly.
                  </p>
                  <div className="mb-4">
                    <label htmlFor="manualApiKey" className="block text-sm font-medium text-gray-700">
                      Google API Key
                    </label>
                    <input
                      type="text"
                      id="manualApiKey"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={manualApiKey}
                      onChange={(e) => setManualApiKey(e.target.value)}
                      placeholder="Enter your Google API Key"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="manualClientId" className="block text-sm font-medium text-gray-700">
                      Google Client ID
                    </label>
                    <input
                      type="text"
                      id="manualClientId"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={manualClientId}
                      onChange={(e) => setManualClientId(e.target.value)}
                      placeholder="Enter your Google Client ID"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={initializeWithManualCredentials}
                >
                  Initialize
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setManualCredentialsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 