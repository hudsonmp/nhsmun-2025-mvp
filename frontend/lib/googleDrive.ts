// This is a simplified module for Google Drive integration

// Type definitions for gapi and global window object
declare global {
  interface Window {
    gapi: any;
  }
}

// Load the Google API client library
export const loadGoogleApi = (useManualCredentials = false) => {
  return new Promise<void>((resolve, reject) => {
    // Check if the API is already loaded
    if (window.gapi && window.gapi.client && window.gapi.client.drive) {
      console.log('Google API already loaded');
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      console.log('Google API script loaded');
      window.gapi.load('client:auth2', () => {
        console.log('Google client and auth2 libraries loaded');
        
        // Get credentials - either from env vars or from sessionStorage if using manual credentials
        const apiKey = useManualCredentials 
          ? sessionStorage.getItem('MANUAL_GOOGLE_API_KEY') 
          : process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
          
        const clientId = useManualCredentials 
          ? sessionStorage.getItem('MANUAL_GOOGLE_CLIENT_ID') 
          : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        // Initialize the client with your credentials
        window.gapi.client.init({
          apiKey: apiKey,
          clientId: clientId,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'
        }).then(() => {
          console.log('Google API client initialized successfully');
          resolve();
        }).catch((error: any) => {
          console.error('Error initializing Google API client:', {
            message: error.message,
            details: error,
            apiKey: apiKey ? 'Provided' : 'Missing',
            clientId: clientId ? 'Provided' : 'Missing',
            usingManualCredentials: useManualCredentials
          });
          reject(new Error(`Failed to initialize Google API client: ${error.message || 'Unknown error'}`));
        });
      });
    };
    script.onerror = (error) => {
      console.error('Error loading Google API script:', error);
      reject(new Error('Failed to load Google API script'));
    };
    document.body.appendChild(script);
  });
};

// Check if user is authenticated with Google
export const isGoogleAuthenticated = () => {
  if (!window.gapi || !window.gapi.auth2) {
    return false;
  }
  
  const authInstance = window.gapi.auth2.getAuthInstance();
  return authInstance.isSignedIn.get();
};

// Sign in with Google
export const signInWithGoogle = async () => {
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error('Google API not loaded');
  }
  
  const authInstance = window.gapi.auth2.getAuthInstance();
  return await authInstance.signIn();
};

// Sign out from Google
export const signOutFromGoogle = async () => {
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error('Google API not loaded');
  }
  
  const authInstance = window.gapi.auth2.getAuthInstance();
  return await authInstance.signOut();
};

// List Google Drive files
export const listDriveFiles = async (query = '') => {
  return new Promise((resolve, reject) => {
    try {
      // Check if Google API is properly loaded
      if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
        throw new Error('Google Drive API not properly initialized');
      }

      window.gapi.client.drive.files.list({
        pageSize: 30,
        fields: 'files(id, name, mimeType, modifiedTime)',
        q: query ? `name contains '${query}' and trashed = false` : 'trashed = false',
        orderBy: 'modifiedTime desc'
      }).then((response: any) => {
        resolve(response.result.files);
      }).catch((error: any) => {
        console.error('Google Drive API error details:', {
          message: error.message,
          status: error.status,
          result: error.result,
          stack: error.stack
        });
        reject(new Error(`Google Drive API error: ${error.message || 'Unknown error'}`));
      });
    } catch (error: any) {
      console.error('Google Drive operation error:', error);
      reject(new Error(`Failed to list Google Drive files: ${error.message || 'Unknown error'}`));
    }
  });
};

// Get a Google Drive file
export const getDriveFile = async (fileId: string) => {
  return new Promise((resolve, reject) => {
    window.gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, modifiedTime, webContentLink'
    }).then((response: any) => {
      resolve(response.result);
    }).catch((error: any) => {
      reject(error);
    });
  });
};

// Download a Google Drive file
export const downloadDriveFile = async (fileId: string) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${window.gapi.auth.getToken().access_token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to download file');
  }
  
  return await response.blob();
};

// Diagnostic function to check Google Drive API configuration
export const checkGoogleDriveConfig = async () => {
  const diagnostics: Record<string, any> = {
    configStatus: {},
    apiStatus: {},
    errors: [],
    apiTests: {}
  };

  // Check environment variables
  diagnostics.configStatus.apiKeyProvided = !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  diagnostics.configStatus.clientIdProvided = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!diagnostics.configStatus.apiKeyProvided) {
    diagnostics.errors.push('Google API Key is missing in environment variables');
  }
  
  if (!diagnostics.configStatus.clientIdProvided) {
    diagnostics.errors.push('Google Client ID is missing in environment variables');
  }

  diagnostics.configStatus.apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY 
    ? `${process.env.NEXT_PUBLIC_GOOGLE_API_KEY.substring(0, 5)}...` 
    : 'Missing'; // Show only first few characters for security
  
  diagnostics.configStatus.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID 
    ? `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 10)}...` 
    : 'Missing';

  // Check if API is loaded
  try {
    diagnostics.apiStatus.gapiLoaded = !!window.gapi;
    diagnostics.apiStatus.clientLoaded = !!(window.gapi && window.gapi.client);
    diagnostics.apiStatus.authLoaded = !!(window.gapi && window.gapi.auth2);
    diagnostics.apiStatus.driveLoaded = !!(window.gapi && window.gapi.client && window.gapi.client.drive);
    
    // Check authentication status
    if (diagnostics.apiStatus.authLoaded) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      diagnostics.apiStatus.isSignedIn = authInstance.isSignedIn.get();
      
      if (diagnostics.apiStatus.isSignedIn) {
        const user = authInstance.currentUser.get();
        const profile = user.getBasicProfile();
        diagnostics.apiStatus.user = {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail()
        };
        
        // Check auth token
        try {
          const authToken = window.gapi.auth.getToken();
          diagnostics.apiStatus.hasValidToken = !!authToken && !!authToken.access_token;
          diagnostics.apiStatus.tokenExpiry = authToken?.expires_at 
            ? new Date(authToken.expires_at).toISOString() 
            : 'Unknown';
          
          if (!diagnostics.apiStatus.hasValidToken) {
            diagnostics.errors.push('No valid Google auth token found');
          }
        } catch (error: any) {
          diagnostics.errors.push(`Error checking auth token: ${error.message}`);
        }
        
        // Check if user has necessary scopes
        const scopes = user.getGrantedScopes();
        diagnostics.apiStatus.scopes = scopes;
        diagnostics.apiStatus.hasFileScope = scopes.includes('https://www.googleapis.com/auth/drive.file');
        diagnostics.apiStatus.hasReadScope = scopes.includes('https://www.googleapis.com/auth/drive.readonly');
        
        if (!diagnostics.apiStatus.hasFileScope || !diagnostics.apiStatus.hasReadScope) {
          diagnostics.errors.push('Missing required Google Drive scopes. Please disconnect and reconnect');
        }
      } else {
        diagnostics.errors.push('User is not signed in to Google');
      }
    } else {
      diagnostics.errors.push('Google Auth API not loaded');
    }
    
    if (!diagnostics.apiStatus.driveLoaded) {
      diagnostics.errors.push('Google Drive API not loaded');
    }
    
    // Test API endpoints if signed in
    if (diagnostics.apiStatus.isSignedIn && diagnostics.apiStatus.driveLoaded) {
      try {
        // Test a simple API call to list files (limit to just 1 file to be efficient)
        diagnostics.apiTests.testingListFiles = true;
        const response = await new Promise((resolve, reject) => {
          window.gapi.client.drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)'
          }).then(
            (response: any) => resolve(response),
            (error: any) => reject(error)
          );
        });
        
        diagnostics.apiTests.listFilesSuccess = true;
        diagnostics.apiTests.listFilesResponse = 'Successfully fetched file list';
      } catch (error: any) {
        diagnostics.apiTests.listFilesSuccess = false;
        diagnostics.apiTests.listFilesError = {
          message: error.message,
          status: error.status,
          code: error.code
        };
        diagnostics.errors.push(`API test failed: ${error.message}`);
      }
    }
  } catch (error: any) {
    diagnostics.errors.push(`Error checking API status: ${error.message}`);
  }
  
  console.log('Google Drive API Diagnostics:', diagnostics);
  return diagnostics;
}; 