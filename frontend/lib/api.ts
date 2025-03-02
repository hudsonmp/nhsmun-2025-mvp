import axios, { AxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    // Get session token directly from Supabase
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (userData: { email: string; username: string; password: string }) => {
    console.log('Starting registration process for:', userData.email);
    try {
      console.log('Sending signup request to Supabase');
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
          },
        },
      });
      
      if (error) {
        console.error('Registration error from Supabase:', error);
        throw error;
      }
      
      console.log('Registration successful, Supabase response:', data);
      return data;
    } catch (error: any) {
      console.error('Registration exception:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        status: error.status,
      });
      throw error;
    }
  },

  // Login a user
  login: async (credentials: { email: string; password: string }) => {
    console.log('Starting login process for:', credentials.email);
    try {
      console.log('Sending login request to Supabase');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        console.error('Login error from Supabase:', error);
        throw error;
      }
      
      console.log('Login successful, Supabase response:', 
        data.session ? { 
          user: data.session.user.email,
          expires_at: data.session.expires_at
        } : 'No session'
      );
      
      return data;
    } catch (error: any) {
      console.error('Login exception:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        status: error.status,
      });
      throw error;
    }
  },

  // Logout the user
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Check if the user is authenticated
  isAuthenticated: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  },

  // Get the current user
  getCurrentUser: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
};

// Documents API
export const documentsAPI = {
  // Get all documents with optional filters
  getDocuments: async (filters = {}) => {
    try {
      const response = await api.get('/documents', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific document by ID
  getDocument: async (documentId: string) => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new document
  createDocument: async (documentData: any) => {
    try {
      const response = await api.post('/documents', documentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing document
  updateDocument: async (documentId: string, documentData: any) => {
    try {
      const response = await api.put(`/documents/${documentId}`, documentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (documentId: string) => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check document format
  checkDocumentFormat: async (documentId: string) => {
    try {
      const response = await api.post(`/documents/${documentId}/format-check`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
}; 