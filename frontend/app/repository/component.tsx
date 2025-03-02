'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Document, DocumentFilters, DocumentType, CommitteeType } from '@/lib/document';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'react-hot-toast';
import { googleDriveService } from '@/lib/googleDrive';
import { documentAPI } from '@/lib/supabase';

/**
 * Repository Component for MUN Connect
 * 
 * Features:
 * - Document listing with filtering
 * - Document details view
 * - Document format checking
 * - Search functionality
 */

// Extend Document type to include drive-related fields
interface DocumentWithDrive extends Document {
  drive_web_link?: string;
  drive_metadata?: any;
}

export default function RepositoryComponent() {
  const { user, logout, isGoogleDriveAuthenticated, authenticateGoogleDrive } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentWithDrive[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({
    type: 'all',
    committee: 'all',
    country: 'all',
    searchQuery: '',
  });
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showFormatCheck, setShowFormatCheck] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'position_paper' as DocumentType,
    committee: 'UNSC' as CommitteeType,
    country: '',
    topic: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Reference data
  const committees = ['UNSC', 'UNHRC', 'UNEP', 'DISEC', 'WHO', 'ECOSOC'] as const;
  const countries = ['United States', 'China', 'Russia', 'United Kingdom', 'France', 'Germany', 'India', 'Brazil'];
  const documentTypes = ['position_paper', 'resolution', 'speech', 'research'] as const;
  
  // Load documents from API
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Check Google Drive authentication first
      if (!isGoogleDriveAuthenticated) {
        const authenticated = await authenticateGoogleDrive();
        if (!authenticated) {
          throw new Error('Please connect Google Drive to your MUN Connect profile first');
        }
      }

      // Fetch documents from Supabase
      const docs = await documentAPI.getDocuments();
      
      // Fetch Google Drive metadata for each document
      const docsWithMetadata = await Promise.all(
        docs.map(async (doc) => {
          if (doc.drive_file_id) {
            try {
              const driveData = await googleDriveService.getGoogleDoc(doc.drive_file_id);
              return {
                ...doc,
                drive_metadata: driveData,
              };
            } catch (error) {
              console.warn(`Failed to fetch Google Drive metadata for doc ${doc.id}:`, error);
              return doc;
            }
          }
          return doc;
        })
      );

      setDocuments(docsWithMetadata);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast.error(error.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isGoogleDriveAuthenticated, authenticateGoogleDrive]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters to documents
  const filteredDocuments = documents.filter((doc: Document) => {
    return (
      (filters.type === 'all' || doc.type === filters.type) &&
      (filters.committee === 'all' || doc.committee === filters.committee) &&
      (filters.country === 'all' || doc.country === filters.country) &&
      (filters.searchQuery === '' || 
        doc.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        doc.topic.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    );
  });

  // Handle document selection
  const handleDocumentClick = (doc: Document) => {
    setSelectedDoc(doc);
  };

  // Handle format check request
  const handleFormatCheck = () => {
    setShowFormatCheck(true);
    // In a real app, this would call an API
    setTimeout(() => {
      setShowFormatCheck(false);
      
      if (selectedDoc) {
        // Update the selected document with format check results
        const updatedDoc = { 
          ...selectedDoc, 
          format_status: Math.random() > 0.5 ? 'valid' : 'issues' as 'valid' | 'issues'
        };
        setSelectedDoc(updatedDoc);
        
        setDocuments((docs) => 
          docs.map((d) => d.id === updatedDoc.id ? updatedDoc : d)
        );
      }
    }, 2000);
  };

  // Reset all filters to default values
  const resetFilters = () => {
    setFilters({
      type: 'all',
      committee: 'all',
      country: 'all',
      searchQuery: '',
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle new document creation
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // First create the document in Supabase
      const doc = await documentAPI.createDocument({
        ...newDocument,
        file_type: 'gdoc',
        create_google_doc: true
      });

      // Check if already authenticated, if not, authenticate
      if (!isGoogleDriveAuthenticated) {
        const authenticated = await authenticateGoogleDrive();
        if (!authenticated) {
          throw new Error('Please connect Google Drive to your MUN Connect profile first');
        }
      }
      
      // Create the Google Doc
      const { id: googleDocId, webViewLink } = await googleDriveService.createGoogleDoc({
        ...doc,
        user: {
          id: user?.id || '',
          email: user?.email || '',
          username: user?.email || 'unknown',
          name: user?.email?.split('@')[0] || 'Unknown User'
        }
      });

      // Update the document with Google Doc ID and link
      await documentAPI.updateDocument(doc.id, {
        drive_file_id: googleDocId,
        drive_web_link: webViewLink,
        sync_status: 'synced',
        last_synced: new Date().toISOString()
      });

      toast.success('Document created successfully');
      setIsCreateModalOpen(false);
      loadData(); // Refresh the documents list
    } catch (error: any) {
      console.error('Failed to create document:', error);
      toast.error(error.message || 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Document Repository
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Access and manage Model UN documents, including position papers and resolutions
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mr-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create in Google Docs
            </button>
            <Link
              href="/repository/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Document
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Filters Panel */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              
              <div className="mt-6 space-y-6">
                {/* Search Query */}
                <div>
                  <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="searchQuery"
                      id="searchQuery"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search by title or topic"
                      value={filters.searchQuery}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                
                {/* Document Type Filter */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Document Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Types</option>
                    {documentTypes.map((type: DocumentType) => (
                      <option key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                
                {/* Committee Filter */}
                <div>
                  <label htmlFor="committee" className="block text-sm font-medium text-gray-700">
                    Committee
                  </label>
                  <select
                    id="committee"
                    name="committee"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.committee}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Committees</option>
                    {committees.map((committee: CommitteeType) => (
                      <option key={committee} value={committee}>{committee}</option>
                    ))}
                  </select>
                </div>
                
                {/* Country Filter */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.country}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Countries</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                {/* Reset Filters Button */}
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Document List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                {filteredDocuments.length > 0 ? (
                  <p className="mt-1 text-sm text-gray-500">
                    Showing {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                  </p>
                ) : null}
              </div>
              
              {/* Loading State */}
              {isLoading ? (
                <div className="px-4 py-6 sm:px-6 text-center">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-gray-500">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading documents...
                  </div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="px-4 py-12 sm:px-6 text-center bg-white">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by uploading your first document.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/repository/upload"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload Document
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <DocumentListItem 
                      key={doc.id}
                      document={doc}
                      isSelected={selectedDoc?.id === doc.id}
                      onClick={() => handleDocumentClick(doc)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Document Details Panel */}
            {selectedDoc && (
              <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Document Details
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {selectedDoc.title}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleFormatCheck}
                      disabled={showFormatCheck}
                    >
                      {showFormatCheck ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Checking...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Format Check
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => router.push(`/repository/edit/${selectedDoc.id}`)}
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
                
                {/* Document Details Data */}
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Document Type
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                        {selectedDoc.type.replace('_', ' ')}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Committee
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {selectedDoc.committee}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Country
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {selectedDoc.country}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Topic
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {selectedDoc.topic}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Created By
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {selectedDoc.user.name}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Created At
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(selectedDoc.created_at).toLocaleString()}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Format Status
                      </dt>
                      <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                        <FormatStatus status={selectedDoc.format_status} />
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Document Modal */}
      {isCreateModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCreateModalOpen(false)} />

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {/* Close button */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal content */}
              <div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Create New Document
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter a title for your new document. Other details can be added later.
                  </p>
                </div>

                <form onSubmit={handleCreateDocument} className="mt-5 sm:mx-auto sm:w-full">
                  <div className="space-y-4">
                    {/* Title field */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Document Title <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          value={newDocument.title}
                          onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter document title"
                        />
                      </div>
                    </div>

                    {/* Optional fields in a collapsible section */}
                    <div className="bg-gray-50 rounded-md p-4">
                      <button
                        type="button"
                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                      >
                        <svg 
                          className={`h-5 w-5 transform ${showOptionalFields ? 'rotate-90' : ''} transition-transform`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="ml-2">Additional Details (Optional)</span>
                      </button>

                      {showOptionalFields && (
                        <div className="mt-4 space-y-4">
                          {/* Document Type */}
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                              Document Type
                            </label>
                            <select
                              id="type"
                              name="type"
                              value={newDocument.type}
                              onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              {documentTypes.map((docType: DocumentType) => (
                                <option key={docType} value={docType}>
                                  {docType.replace('_', ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Committee */}
                          <div>
                            <label htmlFor="committee" className="block text-sm font-medium text-gray-700">
                              Committee
                            </label>
                            <select
                              id="committee"
                              name="committee"
                              value={newDocument.committee}
                              onChange={(e) => setNewDocument(prev => ({ ...prev, committee: e.target.value as CommitteeType }))}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              {committees.map((committee: CommitteeType) => (
                                <option key={committee} value={committee}>{committee}</option>
                              ))}
                            </select>
                          </div>

                          {/* Country */}
                          <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                              Country
                            </label>
                            <input
                              type="text"
                              name="country"
                              id="country"
                              value={newDocument.country}
                              onChange={(e) => setNewDocument(prev => ({ ...prev, country: e.target.value }))}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Topic */}
                          <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                              Topic
                            </label>
                            <input
                              type="text"
                              name="topic"
                              id="topic"
                              value={newDocument.topic}
                              onChange={(e) => setNewDocument(prev => ({ ...prev, topic: e.target.value }))}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:bg-blue-400"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : 'Create Document'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Document List Item Component
 * Displays a single document in the repository list
 */
function DocumentListItem({ document, isSelected, onClick }: {
  document: Document;
  isSelected: boolean;
  onClick: () => void;
}) {
  // Function to determine document icon based on type
  const getDocumentIcon = () => {
    if (document.type === 'position_paper') {
      return (
        <svg className="h-12 w-12 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (document.type === 'resolution') {
      return (
        <svg className="h-12 w-12 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    } else if (document.type === 'speech') {
      return (
        <svg className="h-12 w-12 text-amber-500 group-hover:text-amber-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-12 w-12 text-gray-500 group-hover:text-gray-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  // Format the date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    }).format(date);
  };

  return (
    <li 
      className={`group relative rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
        isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'bg-white'
      }`}
    >
      {/* Main clickable area */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          {/* Document icon */}
          <div className="flex-shrink-0">
            {getDocumentIcon()}
          </div>
          
          {/* Document metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
              {document.title}
            </h3>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-4">
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(document.created_at)}
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {document.committee}
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {document.country}
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <FormatStatusBadge status={document.format_status} />
              
              {document.topic && (
                <span className="ml-3 text-xs text-gray-500 truncate">
                  Topic: {document.topic}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Document actions */}
      <div className="absolute top-3 right-3 flex space-x-2">
        {document.drive_file_id && (
          <a 
            href={`https://docs.google.com/document/d/${document.drive_file_id}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors duration-200"
            title="Edit in Google Docs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </a>
        )}
      </div>
      
      {/* View button (overlaid at the bottom) */}
      <div className="absolute bottom-0 right-0 p-2">
        <Link
          href={`/repository/document/${document.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <svg className="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </Link>
      </div>
    </li>
  );
}

/**
 * Format Status Badge Component
 * Displays a colored badge indicating document format validation status
 */
function FormatStatusBadge({ status }: { status: string }) {
  if (status === 'valid') {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        Valid Format
      </span>
    );
  } else if (status === 'issues') {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Format Issues
      </span>
    );
  } else {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
        Not Checked
      </span>
    );
  }
}

/**
 * Format Status Component
 * Displays detailed format status including issues list if applicable
 */
function FormatStatus({ status }: { status: string }) {
  if (status === 'valid') {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        Valid Format
      </span>
    );
  } else if (status === 'issues') {
    return (
      <div>
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Format Issues
        </span>
        <ul className="mt-2 text-sm text-red-600 list-disc pl-5 space-y-1">
          <li>Incorrect heading format</li>
          <li>Missing country flag in header</li>
          <li>Citation style inconsistent</li>
        </ul>
      </div>
    );
  } else {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
        Not Checked
      </span>
    );
  }
} 