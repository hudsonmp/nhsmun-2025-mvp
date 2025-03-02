'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { googleDriveService } from '@/lib/googleDrive';

// Define the type for the context value
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  // Google Drive authentication
  isGoogleDriveAuthenticated: boolean;
  isGoogleDriveLoading: boolean;
  authenticateGoogleDrive: () => Promise<boolean>;
  initializeGoogleDrive: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  session: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  checkAuth: async () => false,
  // Google Drive authentication defaults
  isGoogleDriveAuthenticated: false,
  isGoogleDriveLoading: false,
  authenticateGoogleDrive: async () => false,
  initializeGoogleDrive: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Google Drive state
  const [isGoogleDriveAuthenticated, setIsGoogleDriveAuthenticated] = useState(false);
  const [isGoogleDriveLoading, setIsGoogleDriveLoading] = useState(false);
  const [isGoogleDriveInitialized, setIsGoogleDriveInitialized] = useState(false);
  
  const router = useRouter();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Get the current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          console.log('Auth initialized from Supabase session');
          
          // Initialize Google Drive when user is authenticated
          if (!isGoogleDriveInitialized) {
            initializeGoogleDrive();
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
          console.log('No active Supabase session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(true);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in, updating state with session data');
          // Initialize Google Drive when user signs in
          if (!isGoogleDriveInitialized) {
            initializeGoogleDrive();
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Session token refreshed automatically');
        }
      } else {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsGoogleDriveAuthenticated(false);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing session data');
        }
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Initialize Google Drive API
  const initializeGoogleDrive = async () => {
    if (isGoogleDriveInitialized) return;
    
    setIsGoogleDriveLoading(true);
    try {
      await googleDriveService.initialize();
      setIsGoogleDriveInitialized(true);
      
      // Check if already authenticated
      const isAuthenticated = googleDriveService.isAuthenticated();
      setIsGoogleDriveAuthenticated(isAuthenticated);
      
      console.log('Google Drive API initialized, authenticated:', isAuthenticated);
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
    } finally {
      setIsGoogleDriveLoading(false);
    }
  };

  // Authenticate with Google Drive
  const authenticateGoogleDrive = async () => {
    setIsGoogleDriveLoading(true);
    try {
      // Make sure Google Drive is initialized
      if (!isGoogleDriveInitialized) {
        await initializeGoogleDrive();
      }
      
      // Authenticate with Google Drive
      const authenticated = await googleDriveService.authenticate();
      setIsGoogleDriveAuthenticated(authenticated);
      
      console.log('Google Drive authentication result:', authenticated);
      return authenticated;
    } catch (error) {
      console.error('Google Drive authentication error:', error);
      return false;
    } finally {
      setIsGoogleDriveLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authAPI.login({ email, password });
      console.log('Login result in AuthContext:', result && result.session ? 'Session present' : 'No session');
      
      if (result && result.session) {
        setSession(result.session);
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Initialize Google Drive after login
        if (!isGoogleDriveInitialized) {
          initializeGoogleDrive();
        }
      } else {
        console.warn('Login successful but no session returned:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const result = await authAPI.register({ email, username, password });
      return result;
    } catch (error) {
      console.error('Registration error in context:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      await authAPI.logout();
      
      // Clear authentication state
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
      setIsGoogleDriveAuthenticated(false);
      
      console.log('Logout complete, redirecting to auth page');
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuth = async () => {
    try {
      // Get the current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
        return false;
      }
    } catch (error) {
      console.error('Check auth error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        session,
        loading,
        login, 
        register,
        logout,
        checkAuth,
        // Google Drive authentication
        isGoogleDriveAuthenticated,
        isGoogleDriveLoading,
        authenticateGoogleDrive,
        initializeGoogleDrive
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 