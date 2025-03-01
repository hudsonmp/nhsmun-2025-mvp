import axios, { AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = Cookies.get('token');
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
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login a user
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { access_token } = response.data;
      
      // Store the token in a cookie
      Cookies.set('token', access_token, { expires: 1 }); // Expires in 1 day
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout the user
  logout: () => {
    Cookies.remove('token');
  },

  // Check if the user is authenticated
  isAuthenticated: () => {
    return !!Cookies.get('token');
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