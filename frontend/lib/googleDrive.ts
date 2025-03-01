// This is a simplified module for Google Drive integration

// Type definitions for gapi and global window object
declare global {
  interface Window {
    gapi: any;
    google: any;
    [key: string]: any; // Allow indexing with strings
  }
}

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Load the Google API client library
export const loadGoogleApi = (useManualCredentials?: boolean) => {
  return new Promise<void>((resolve, reject) => {
    // Check if we're in a browser environment
    if (!isBrowser) {
      console.warn('Google API cannot be loaded in a non-browser environment');
      reject(new Error('Google API requires a browser environment'));
      return;
    }
    
    // Check if the API is already loaded
    if (window.gapi && window.gapi.client && window.gapi.client.drive) {
      console.log('Google API already loaded');
      resolve();
      return;
    }

    // Define a global callback that will be called when the script loads
    const callbackName = 'googleApiLoaded_' + Math.random().toString(36).substring(2, 15);
    window[callbackName] = () => {
      console.log('Google API script loaded via callback');
      initializeGoogleClient(useManualCredentials, resolve, reject);
    };

    const script = document.createElement('script');
    script.src = `https://apis.google.com/js/api.js?onload=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google API script onload event triggered');
      // The callback will handle initialization
    };
    script.onerror = (error) => {
      console.error('Error loading Google API script:', error);
      reject(new Error('Failed to load Google API script'));
    };
    document.body.appendChild(script);
  });
};

// Helper function to initialize the Google client
const initializeGoogleClient = (useManualCredentials?: boolean, resolve?: (value: void) => void, reject?: (reason: any) => void) => {
  if (!window.gapi) {
    const error = new Error('Google API (gapi) not available after loading');
    console.error(error);
    reject?.(error);
    return;
  }

  window.gapi.load('client:auth2', async () => {
    console.log('Google client and auth2 libraries loaded');
    
    try {
      // Get API key and client ID
      let apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      // If using manual credentials, try to get them from session storage
      if (useManualCredentials) {
        const manualApiKey = sessionStorage.getItem('MANUAL_GOOGLE_API_KEY');
        const manualClientId = sessionStorage.getItem('MANUAL_GOOGLE_CLIENT_ID');
        
        if (manualApiKey && manualClientId) {
          apiKey = manualApiKey;
          clientId = manualClientId;
          console.log('Using manually provided Google API credentials');
        }
      }
      
      console.log('Google Drive API Configuration:', {
        apiKeyAvailable: !!apiKey,
        clientIdAvailable: !!clientId
      });
      
      if (!apiKey || !clientId) {
        const error = new Error('Google Drive API keys not configured');
        console.error(error);
        reject?.(error);
        return;
      }
      
      try {
        // Initialize the client with your credentials
        await window.gapi.client.init({
          apiKey: apiKey,
          clientId: clientId,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'
        });
        
        console.log('Google API client initialized successfully');
        resolve?.();
      } catch (error: any) {
        console.error('Error initializing Google API client:', {
          message: error.message,
          details: error,
          apiKey: apiKey ? 'Provided' : 'Missing',
          clientId: clientId ? 'Provided' : 'Missing'
        });
        reject?.(new Error(`Failed to initialize Google API client: ${error.message || 'Unknown error'}`));
      }
    } catch (error: any) {
      console.error('Error in client:auth2 callback:', error);
      reject?.(new Error(`Error in Google API initialization: ${error.message || 'Unknown error'}`));
    }
  });
};

// Check if user is authenticated with Google
export const isGoogleAuthenticated = () => {
  // Check if we're in a browser environment
  if (!isBrowser) {
    console.warn('Google authentication check requires a browser environment');
    return false;
  }
  
  if (!window.gapi || !window.gapi.auth2) {
    console.warn('Google API or auth2 not loaded');
    return false;
  }
  
  try {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance) {
      console.warn('Google Auth instance not available');
      return false;
    }
    const isSignedIn = authInstance.isSignedIn.get();
    console.log('Google authentication status:', isSignedIn ? 'Authenticated' : 'Not authenticated');
    return isSignedIn;
  } catch (error) {
    console.error('Error checking Google authentication:', error);
    return false;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  // Check if we're in a browser environment
  if (!isBrowser) {
    throw new Error('Google sign-in requires a browser environment');
  }
  
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error('Google API not loaded');
  }
  
  try {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance) {
      throw new Error('Google Auth instance not available');
    }
    return await authInstance.signIn();
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(`Google sign-in failed: ${error.message || 'Unknown error'}`);
  }
};

// Sign out from Google
export const signOutFromGoogle = async () => {
  // Check if we're in a browser environment
  if (!isBrowser) {
    throw new Error('Google sign-out requires a browser environment');
  }
  
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error('Google API not loaded');
  }
  
  try {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance) {
      throw new Error('Google Auth instance not available');
    }
    return await authInstance.signOut();
  } catch (error: any) {
    console.error('Error signing out from Google:', error);
    throw new Error(`Google sign-out failed: ${error.message || 'Unknown error'}`);
  }
};

// List Google Drive files
export const listDriveFiles = async (query = '') => {
  return new Promise((resolve, reject) => {
    try {
      // Check if we're in a browser environment
      if (!isBrowser) {
        throw new Error('Google Drive API requires a browser environment');
      }
      
      // Check if Google API is properly loaded
      if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
        throw new Error('Google Drive API not loaded');
      }

      // Check if user is authenticated
      if (!isGoogleAuthenticated()) {
        throw new Error('User not authenticated with Google');
      }

      console.log('Listing Google Drive files with query:', query || 'No query');
      
      window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, iconLink, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 50
      }).then((response: any) => {
        console.log('Google Drive files retrieved:', response.result.files.length);
        resolve(response.result.files);
      }).catch((error: any) => {
        console.error('Error listing Google Drive files:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error in listDriveFiles:', error);
      reject(error);
    }
  });
};

// Get a specific file from Google Drive
export const getDriveFile = async (fileId: string) => {
  // Check if we're in a browser environment
  if (!isBrowser) {
    throw new Error('Google Drive API requires a browser environment');
  }
  
  if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
    throw new Error('Google Drive API not loaded');
  }

  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, iconLink, modifiedTime, webViewLink, webContentLink'
    });
    
    return response.result;
  } catch (error: any) {
    console.error('Error getting Drive file:', error);
    throw new Error(`Failed to get Drive file: ${error.message || 'Unknown error'}`);
  }
};

// Download a file from Google Drive
export const downloadDriveFile = async (fileId: string) => {
  // Check if we're in a browser environment
  if (!isBrowser) {
    throw new Error('Google Drive API requires a browser environment');
  }
  
  if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
    throw new Error('Google Drive API not loaded');
  }

  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    
    return response.body;
  } catch (error: any) {
    console.error('Error downloading Drive file:', error);
    throw new Error(`Failed to download Drive file: ${error.message || 'Unknown error'}`);
  }
};

// Check if Google Drive API is properly configured
export const checkGoogleDriveConfig = async () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  const errors = [];
  if (!apiKey) errors.push('API Key is missing');
  if (!clientId) errors.push('Client ID is missing');
  
  const config = {
    apiKey: apiKey ? true : false,
    clientId: clientId ? true : false,
    isConfigured: !!(apiKey && clientId),
    errors: errors,
    apiStatus: {
      gapiLoaded: isBrowser && !!window.gapi,
      clientLoaded: isBrowser && !!window.gapi?.client,
      authLoaded: isBrowser && !!window.gapi?.auth2,
      driveLoaded: isBrowser && !!window.gapi?.client?.drive
    }
  };
  
  console.log('Google Drive API configuration:', config);
  
  return config;
}; 