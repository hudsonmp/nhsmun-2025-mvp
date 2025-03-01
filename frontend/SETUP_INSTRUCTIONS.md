# MUN Connect: Supabase Auth & Google Drive Integration Setup

This guide provides detailed instructions for setting up Supabase authentication and Google Drive integration for the MUN Connect platform.

## Table of Contents
- [Supabase Configuration](#supabase-configuration)
  - [Setting Up Your Supabase Project](#setting-up-your-supabase-project)
  - [Database Tables Configuration](#database-tables-configuration)
  - [Authentication Configuration](#authentication-configuration)
  - [Email Authentication Troubleshooting](#email-authentication-troubleshooting)
  - [RLS Policies](#rls-policies)
- [Google Drive Integration](#google-drive-integration)
  - [Project Setup in Google Cloud Console](#project-setup-in-google-cloud-console)
  - [OAuth Consent Screen](#oauth-consent-screen)
  - [Creating OAuth Credentials](#creating-oauth-credentials)
  - [Enabling the Google Drive API](#enabling-the-google-drive-api)
- [Frontend Integration](#frontend-integration)
  - [Supabase Client Setup](#supabase-client-setup)
  - [Google Drive API Client Setup](#google-drive-api-client-setup)
  - [Testing Authentication Flow](#testing-authentication-flow)
  - [Testing Google Drive Integration](#testing-google-drive-integration)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

## Supabase Configuration

### Setting Up Your Supabase Project

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com/) and sign up or log in
   - Click "New Project"

2. **Project Configuration**
   - Name your project (e.g., "MUN-Connect")
   - Choose a secure database password (save this somewhere secure)
   - Select a region closest to your primary user base
   - Select the free plan to start
   - Click "Create new project"

3. **Get Project Credentials**
   - After project creation, go to Project Settings → API
   - Save both the "Project URL" and "anon/public" key for later use
   - These will be used in your `.env.local` file

### Database Tables Configuration

1. **Documents Table**
   - Navigate to the "Table Editor" in your Supabase dashboard
   - Click "New Table"
   - Create a table named `documents` with the following columns:
     ```sql
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     title TEXT NOT NULL,
     type TEXT NOT NULL,
     committee TEXT NOT NULL,
     country TEXT NOT NULL,
     topic TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     format_status TEXT DEFAULT 'pending',
     content TEXT,
     drive_file_id TEXT
     ```

2. **User Profiles Table** (for additional user data beyond auth)
   - Click "New Table"
   - Create a table named `profiles` with the following columns:
     ```sql
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username TEXT UNIQUE,
     full_name TEXT,
     avatar_url TEXT,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
     ```

3. **Create Database Triggers for New Users**
   - Go to the SQL Editor
   - Run the following SQL to automatically create a profile record when a new user signs up:
     ```sql
     -- Create a trigger function
     CREATE OR REPLACE FUNCTION public.handle_new_user()
     RETURNS TRIGGER AS $$
     BEGIN
       INSERT INTO public.profiles (id, username)
       VALUES (new.id, new.email);
       RETURN new;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;

     -- Create the trigger
     CREATE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
     ```

### Authentication Configuration

1. **Email Authentication Setup**
   - Go to Authentication → Providers
   - Ensure "Email" is enabled
   - Under "Email Provider settings":
     - Set "Secure email template" to ON
     - Confirm "Confirm email template" is selected
     - If you want to skip email confirmation (for development/testing): 
       - Set "Enable email confirmations" to OFF (not recommended for production)

2. **Configure Email Templates**
   - Go to Authentication → Email Templates
   - Customize the "Confirm signup" template with your branding:
     - Update the subject to "Welcome to MUN Connect - Confirm Your Email"
     - Customize the email content to match your branding
     - Make sure the confirmation link is prominently displayed

3. **Configure Site URL and Redirect URLs**
   - Go to Authentication → URL Configuration
   - Set Site URL to your frontend URL (e.g., `http://localhost:3000` for development)
   - Add the following Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000`
     - `http://localhost:3000/repository`
     - Your production URLs (when ready)

4. **Update JWT Settings** (optional)
   - Go to Authentication → JWT Settings
   - You can customize the JWT expiry time (default is 3600 seconds/1 hour)
   - For development, you might increase this to 86400 (24 hours)

### Email Authentication Troubleshooting

If email authentication is not working, check these common issues:

1. **Email Delivery Issues**
   - By default, Supabase uses a shared email service with strict sending limits
   - Check Authentication → Logs to see if emails are being sent
   - If emails aren't being delivered, consider setting up a custom SMTP provider:
     - Go to Authentication → Email Settings
     - Enable "Custom SMTP server"
     - Enter your SMTP credentials (services like SendGrid, Mailgun, or Amazon SES)

2. **Email Confirmation Required**
   - If users can sign up but not log in, check if email confirmation is required
   - For testing, you can disable email confirmations temporarily:
     - Go to Authentication → Provider Settings
     - Turn off "Enable email confirmations"
     - Note: Always re-enable this for production

3. **CORS Issues**
   - If API calls from your frontend are failing, check CORS settings:
     - Go to Project Settings → API Settings
     - Add your frontend URL to the "Additional Allowed Websites" section
     - Example: `http://localhost:3000`

4. **Manually Confirm Users** (for testing)
   - For testing, you can manually confirm users:
     - Go to Authentication → Users
     - Find the user and click on their email
     - Click "Confirm user" button

### RLS Policies

Set up Row Level Security policies to secure your data:

1. **Enable RLS on Tables**
   - Go to the Table Editor
   - Select your tables
   - Toggle on "Enable RLS"

2. **Create Policies for Documents Table**
   - Create a policy for reading documents:
     ```sql
     CREATE POLICY "Users can read their own documents" ON documents
     FOR SELECT USING (auth.uid() = user_id);
     ```
   - Create a policy for inserting documents:
     ```sql
     CREATE POLICY "Users can create their own documents" ON documents
     FOR INSERT WITH CHECK (auth.uid() = user_id);
     ```
   - Create a policy for updating documents:
     ```sql
     CREATE POLICY "Users can update their own documents" ON documents
     FOR UPDATE USING (auth.uid() = user_id);
     ```
   - Create a policy for deleting documents:
     ```sql
     CREATE POLICY "Users can delete their own documents" ON documents
     FOR DELETE USING (auth.uid() = user_id);
     ```

3. **Create Policies for User Profiles**
   - Create a policy for reading profiles:
     ```sql
     CREATE POLICY "Profiles are viewable by everyone" ON profiles
     FOR SELECT USING (true);
     ```
   - Create a policy for updating profiles:
     ```sql
     CREATE POLICY "Users can update their own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);
     ```

## Google Drive Integration

### Project Setup in Google Cloud Console

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name your project (e.g., "MUN Connect")
   - Click "Create"

2. **Enable Billing** (required for API usage)
   - In your project, go to Billing
   - Set up billing by linking a payment method
   - Note: Google provides a free tier with sufficient quota for development and small applications

### OAuth Consent Screen

1. **Configure OAuth Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - Select "External" user type (for development)
   - Enter app information:
     - App name: "MUN Connect"
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"

2. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Search for and select:
     - `https://www.googleapis.com/auth/drive.file` (recommended minimal scope)
     - `https://www.googleapis.com/auth/drive.readonly` (if you need more read access)
   - Click "Save and Continue"

3. **Add Test Users**
   - Add your email and any other test users
   - Click "Save and Continue"
   - Click "Back to Dashboard"

### Creating OAuth Credentials

1. **Create OAuth Client ID**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "MUN Connect Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production domain (when ready)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/repository/upload`
     - Your production callback URLs (when ready)
   - Click "Create"
   - **IMPORTANT**: Save the Client ID and Client Secret securely

### Enabling the Google Drive API

1. **Enable the Google Drive API**
   - Go to APIs & Services → Library
   - Search for "Google Drive API"
   - Select "Google Drive API"
   - Click "Enable"

## Frontend Integration

### Supabase Client Setup

1. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Supabase Client File**
   Create a file at `frontend/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   // Create a single supabase client for interacting with your database
   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

3. **Create Environment Variables**
   Create or update `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Update Auth API Integration**
   Update `frontend/lib/api.ts` to use Supabase:
   ```typescript
   import { supabase } from './supabase';

   export const authAPI = {
     register: async (userData: { email: string; username: string; password: string }) => {
       try {
         const { data, error } = await supabase.auth.signUp({
           email: userData.email,
           password: userData.password,
           options: {
             data: {
               username: userData.username,
             },
           },
         });
         
         if (error) throw error;
         return data;
       } catch (error) {
         console.error('Registration error:', error);
         throw error;
       }
     },

     login: async (credentials: { email: string; password: string }) => {
       try {
         const { data, error } = await supabase.auth.signInWithPassword({
           email: credentials.email,
           password: credentials.password,
         });
         
         if (error) throw error;
         return data;
       } catch (error) {
         console.error('Login error:', error);
         throw error;
       }
     },

     logout: async () => {
       try {
         const { error } = await supabase.auth.signOut();
         if (error) throw error;
       } catch (error) {
         console.error('Logout error:', error);
         throw error;
       }
     },

     isAuthenticated: async () => {
       const { data } = await supabase.auth.getSession();
       return !!data.session;
     },

     getCurrentUser: async () => {
       const { data } = await supabase.auth.getUser();
       return data?.user || null;
     }
   };

   export const documentsAPI = {
     createDocument: async (formData: FormData) => {
       try {
         // First upload the file if present
         let fileUrl = null;
         const file = formData.get('file') as File;
         
         if (file && file.name) {
           const fileExt = file.name.split('.').pop();
           const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
           const filePath = `${fileName}`;
           
           const { data: uploadData, error: uploadError } = await supabase.storage
             .from('documents')
             .upload(filePath, file);
             
           if (uploadError) throw uploadError;
           
           // Get the public URL
           const { data: urlData } = supabase.storage
             .from('documents')
             .getPublicUrl(filePath);
             
           fileUrl = urlData.publicUrl;
         }
         
         // Then create the document record
         const { data, error } = await supabase
           .from('documents')
           .insert({
             title: formData.get('title'),
             type: formData.get('type'),
             committee: formData.get('committee'),
             country: formData.get('country'),
             topic: formData.get('topic'),
             drive_file_id: formData.get('driveFileId') || null,
             file_url: fileUrl,
           })
           .select();
           
         if (error) throw error;
         return data;
       } catch (error) {
         console.error('Document creation error:', error);
         throw error;
       }
     },

     // Add other document operations as needed
   };
   ```

### Google Drive API Client Setup

1. **Install Google API Client**
   ```bash
   npm install @react-oauth/google gapi-script
   ```

2. **Create Google API Client Wrapper**
   Create a file at `frontend/lib/googleDrive.ts`:
   ```typescript
   // This is a simplified module for Google Drive integration

   // Load the Google API client library
   export const loadGoogleApi = () => {
     return new Promise<void>((resolve, reject) => {
       const script = document.createElement('script');
       script.src = 'https://apis.google.com/js/api.js';
       script.onload = () => {
         window.gapi.load('client:auth2', () => {
           window.gapi.client.init({
             apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
             clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
             discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
             scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'
           }).then(() => {
             resolve();
           }).catch((error: any) => {
             reject(error);
           });
         });
       };
       script.onerror = (error) => {
         reject(error);
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
       window.gapi.client.drive.files.list({
         pageSize: 30,
         fields: 'files(id, name, mimeType, modifiedTime)',
         q: query ? `name contains '${query}' and trashed = false` : 'trashed = false',
         orderBy: 'modifiedTime desc'
       }).then((response: any) => {
         resolve(response.result.files);
       }).catch((error: any) => {
         reject(error);
       });
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
   ```

3. **Update Google Drive Modal Integration**
   Update the Google Drive picker in `frontend/app/repository/upload/page.tsx` to use the real Google Drive API:
   ```typescript
   // Add imports at the top
   import { useEffect } from 'react';
   import { loadGoogleApi, isGoogleAuthenticated, signInWithGoogle, listDriveFiles, downloadDriveFile } from '@/lib/googleDrive';

   // Add initialization to component
   useEffect(() => {
     // Load Google API when component mounts
     const initGoogleApi = async () => {
       try {
         await loadGoogleApi();
       } catch (error) {
         console.error('Error loading Google API:', error);
       }
     };
     
     initGoogleApi();
   }, []);

   // Replace the mock fetchGoogleDriveFiles with real implementation
   const fetchGoogleDriveFiles = async () => {
     setIsLoadingDriveFiles(true);
     
     try {
       // Check if signed in to Google and sign in if not
       if (!isGoogleAuthenticated()) {
         await signInWithGoogle();
       }
       
       // Get files from Google Drive
       const files = await listDriveFiles(driveSearchQuery);
       setGoogleDriveFiles(files);
     } catch (error) {
       console.error('Error fetching Google Drive files:', error);
       setError('Failed to access Google Drive. Please try again.');
     } finally {
       setIsLoadingDriveFiles(false);
     }
   };

   // Update selectDriveFile to handle real files
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
       
       // Auto-fill form fields based on file name
       // (keep your existing logic for this)
     } catch (error) {
       console.error('Error selecting Drive file:', error);
       setError('Failed to retrieve file from Google Drive.');
     }
   };
   ```

### Testing Authentication Flow

1. **Test Account Creation Flow**
   - Verify email configuration is working:
     - Try signing up with a real email
     - Check if confirmation email is received
     - Click the confirmation link
     - Verify you can log in

2. **Check Logs for Issues**
   - In Supabase dashboard, go to Authentication → Logs
   - Look for any errors related to signup or login attempts
   - Common issues will appear here with detailed messages

3. **Test User Login Without Confirmation (Development Only)**
   If you disabled email confirmation (for development only):
   - Users should be able to log in immediately after registration
   - Check if the login API call is successful by inspecting browser network requests

### Testing Google Drive Integration

1. **Test Google Sign-In**
   - Click the "Select from Google Drive" button
   - You should be prompted to sign in with Google
   - After signing in, ensure the API can fetch file listings

2. **Test File Selection Flow**
   - After signing in, verify that files are displayed
   - Test the search functionality
   - Select a file and verify it appears in your form

3. **Test File Upload**
   - Complete the document form with a Google Drive file selected
   - Submit the form
   - Verify the document appears in your repository with the correct Drive file ID

## Common Issues & Troubleshooting

### Supabase Authentication Issues

1. **Email Signup Not Working**
   - **Problem**: Users can't sign up with email/password
   - **Possible Causes**:
     - Email confirmation is required but emails aren't being delivered
     - CORS issues preventing API calls
     - Form validation errors not being properly handled
   - **Solutions**:
     - Check Authentication → Logs for specific error messages
     - Set up custom SMTP for reliable email delivery
     - Verify your CORS configuration includes your frontend URL
     - Add more detailed error handling in your frontend code

2. **Login Failing After Signup**
   - **Problem**: Users can sign up but not log in
   - **Possible Causes**:
     - Email not confirmed
     - Password requirements not met
     - Session handling issues
   - **Solutions**:
     - Verify email confirmation status in Auth → Users
     - Check if passwords meet minimum requirements (min 6 characters)
     - Inspect network requests during login attempts for specific errors

3. **Session Not Persisting**
   - **Problem**: Users have to log in repeatedly
   - **Possible Causes**:
     - JWT expiration too short
     - Cookie storage issues
   - **Solutions**:
     - Increase JWT expiration time in Auth → JWT Settings
     - Check browser console for storage-related errors

### Google Drive Integration Issues

1. **Google API Not Loading**
   - **Problem**: Google API fails to initialize
   - **Possible Causes**:
     - Script loading failure
     - Missing API keys
     - API not enabled in Google Cloud Console
   - **Solutions**:
     - Check browser console for script loading errors
     - Verify environment variables are set correctly
     - Confirm API is enabled in Google Cloud Console

2. **Permission Errors**
   - **Problem**: Cannot access files even after login
   - **Possible Causes**:
     - Incorrect API scopes
     - OAuth consent screen not configured properly
   - **Solutions**:
     - Check scopes in Google Cloud Console
     - Verify OAuth consent screen configuration
     - Test with a different Google account

3. **File Retrieval Failures**
   - **Problem**: Files list successfully but can't be downloaded
   - **Possible Causes**:
     - Access token expired
     - API rate limiting
     - Drive API permissions issues
   - **Solutions**:
     - Implement token refresh logic
     - Add retry mechanisms for API calls
     - Add better error handling for file download operations

### Other Common Issues

1. **CORS Errors**
   - **Problem**: API requests failing with CORS errors
   - **Solution**: Add your frontend URL to Supabase Project Settings → API → CORS

2. **Database RLS Errors**
   - **Problem**: Users can't access their own data
   - **Solution**: Review and update RLS policies on your tables

3. **Environment Variable Issues**
   - **Problem**: API clients failing to initialize
   - **Solution**: Verify `.env.local` file is correctly configured and restart your development server

4. **Error Handling Improvements**
   - For production-ready code, add more robust error handling:
     ```typescript
     try {
       // API call
     } catch (error) {
       if (error.status === 401) {
         // Handle unauthorized error
       } else if (error.message.includes('CORS')) {
         // Handle CORS error
       } else {
         // Handle other errors
       }
     }
     ```

Remember to always review your browser console and network requests for specific error messages that can help identify the exact issue. 