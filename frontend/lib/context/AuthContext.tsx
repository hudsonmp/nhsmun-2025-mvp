'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Define the type for the context value
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  checkAuth: async () => false,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated with Supabase
        const isAuth = await authAPI.isAuthenticated();
        
        // If Supabase auth confirms the user is authenticated
        if (isAuth) {
          setIsAuthenticated(true);
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
          console.log('Auth initialized from Supabase session');
        } 
        // Fallback to localStorage if Supabase session check fails
        else {
          // Try to get auth state from localStorage (added as a fallback)
          const localAuth = localStorage.getItem('isAuthenticated') === 'true';
          const localUser = localStorage.getItem('user');
          
          if (localAuth && localUser) {
            setIsAuthenticated(true);
            setUser(JSON.parse(localUser));
            console.log('Auth initialized from localStorage fallback');
          } else {
            setIsAuthenticated(false);
            setUser(null);
            console.log('No authentication found');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUser(session.user);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
        }));
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await authAPI.login({ email, password });
      console.log('Login result in AuthContext:', result && result.session ? 'Session present' : 'No session');
      
      if (result && result.session) {
        setIsAuthenticated(true);
        setUser(result.user);
        
        // Store authentication state in localStorage (in addition to cookies)
        // This provides a fallback if cookie handling has issues
        localStorage.setItem('isAuthenticated', 'true');
        
        // Store minimal user info locally to maintain state between page loads
        if (result.user) {
          localStorage.setItem('user', JSON.stringify({
            id: result.user.id,
            email: result.user.email,
          }));
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
      
      // Clear localStorage auth data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      
      // Clear any session cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      console.log('Logout complete, redirecting to auth page');
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const isAuth = await authAPI.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth && !user) {
        const currentUser = await authAPI.getCurrentUser();
        setUser(currentUser);
      }
      
      return isAuth;
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
        loading,
        login, 
        register,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 