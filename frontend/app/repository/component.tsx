'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Document, DocumentFilters } from '@/types/document';
import { documentsAPI } from '@/lib/api';
import { loadGoogleApi, isGoogleAuthenticated, signInWithGoogle, signOutFromGoogle, listDriveFiles } from '@/lib/googleDrive';

/**
 * Repository Component for MUN Connect
 * 
 * Features:
 * - Document listing with filtering
 * - Document details view
 * - Document format checking
 * - Search functionality
 * - Google Drive integration
 */
export default function RepositoryComponent() {
  // State Management
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({
    type: 'all',
    committee: 'all',
    country: 'all',
    searchQuery: '',
  });
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showFormatCheck, setShowFormatCheck] = useState(false);
  const [isGDriveConnected, setIsGDriveConnected] = useState(false);
  const [gDriveDocuments, setGDriveDocuments] = useState<any[]>([]);
  const [isImportingFromDrive, setIsImportingFromDrive] = useState(false);

  // Mock data for development and demos
  const committees = ['UNSC', 'UNHRC', 'UNEP', 'DISEC', 'WHO', 'ECOSOC'];
  const countries = ['United States', 'China', 'Russia', 'United Kingdom', 'France', 'Germany', 'India', 'Brazil'];
  
  // Sample documents data
  const mockDocuments: Document[] = [
    {
      id: '1',
      title: 'Climate Change Position Paper',
      type: 'position_paper',
      committee: 'UNEP',
      country: 'Sweden',
      topic: 'Climate Change',
      created_at: '2025-02-15T12:00:00Z',
      user: { id: '101', email: 'alex@example.com', username: 'alexj', name: 'Alex Johnson' },
      format_status: 'valid',
    },
    {
      id: '2',
      title: 'Draft Resolution on Refugee Rights',
      type: 'resolution',
      committee: 'UNHRC',
      country: 'Germany',
      topic: 'Refugee Rights',
      created_at: '2025-02-10T14:30:00Z',
      user: { id: '102', email: 'sarah@example.com', username: 'sarahp', name: 'Sarah Park' },
      format_status: 'valid',
    },
    {
      id: '3',
      title: 'Position Paper on Nuclear Disarmament',
      type: 'position_paper',
      committee: 'DISEC',
      country: 'Japan',
      topic: 'Nuclear Disarmament',
      created_at: '2025-02-08T09:15:00Z',
      user: { id: '103', email: 'raj@example.com', username: 'rajp', name: 'Raj Patel' },
      format_status: 'issues',
    },
    {
      id: '4',
      title: 'Economic Development Resolution',
      type: 'resolution',
      committee: 'ECOSOC',
      country: 'Brazil',
      topic: 'Economic Development',
      created_at: '2025-02-05T16:45:00Z',
      user: { id: '104', email: 'maria@example.com', username: 'mariar', name: 'Maria Rodriguez' },
      format_status: 'valid',
    },
    {
      id: '5',
      title: 'Global Health Crisis Response',
      type: 'position_paper',
      committee: 'WHO',
      country: 'France',
      topic: 'Pandemic Preparedness',
      created_at: '2025-02-01T11:30:00Z',
      user: { id: '105', email: 'jean@example.com', username: 'jeand', name: 'Jean Dupont' },
      format_status: 'issues',
    },
  ];

  // Load documents (simulating API fetch)
  useEffect(() => {
    const loadData = async () => {
      // In a real app, this would be a fetch call to an API endpoint
      // Example: const response = await fetch('/api/documents');
      // const data = await response.json();
      
      // Simulate API delay
      setTimeout(() => {
        setDocuments(mockDocuments);
        setIsLoading(false);
      }, 1000);

      // Check if user has previously connected to Google Drive
      const driveConnected = localStorage.getItem('gdriveConnected') === 'true';
      setIsGDriveConnected(driveConnected);
      
      // If connected, we would fetch the list of documents from Google Drive
      if (driveConnected) {
        fetchGoogleDriveDocuments();
      }
    };

    loadData();
  }, []);

  // Initialize Google API
  useEffect(() => {
    // Check if Google Drive was previously connected
    const wasConnected = localStorage.getItem('gdriveConnected') === 'true';
    if (wasConnected) {
      setIsGDriveConnected(true);
      
      // Load Google API and fetch documents
      const initGoogleApi = async () => {
        try {
          await loadGoogleApi();
          if (isGoogleAuthenticated()) {
            fetchGoogleDriveDocuments();
          }
        } catch (error) {
          console.error('Error initializing Google API:', error);
        }
      };
      
      initGoogleApi();
    }
  }, []);

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
    // In a real app, this would call an AI format checking API
    // Example: const response = await fetch(`/api/format-check/${selectedDoc.id}`);
    
    // Simulate AI processing delay
    setTimeout(() => {
      setShowFormatCheck(false);
      
      if (selectedDoc) {
        // Update the selected document with format check results
        const updatedDoc = { 
          ...selectedDoc, 
          format_status: Math.random() > 0.5 ? 'valid' : 'issues' as 'valid' | 'issues'
        };
        setSelectedDoc(updatedDoc);
        
        // Also update in the documents list
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

  // Google Drive Integration Functions
  const connectToGoogleDrive = async () => {
    try {
      // Load Google API if not already loaded
      await loadGoogleApi();
      
      // Sign in with Google
      await signInWithGoogle();
      
      setIsGDriveConnected(true);
      localStorage.setItem('gdriveConnected', 'true');
      fetchGoogleDriveDocuments();
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      alert('Failed to connect to Google Drive. Please try again.');
    }
  };

  const disconnectGoogleDrive = async () => {
    try {
      // Sign out from Google
      if (isGoogleAuthenticated()) {
        await signOutFromGoogle();
      }
      
      setIsGDriveConnected(false);
      setGDriveDocuments([]);
      localStorage.removeItem('gdriveConnected');
    } catch (error) {
      console.error('Error disconnecting from Google Drive:', error);
    }
  };

  const fetchGoogleDriveDocuments = async () => {
    try {
      // Get document files from Google Drive
      const files = await listDriveFiles("mimeType contains 'document' or mimeType contains 'pdf'");
      setGDriveDocuments(files as any[]);
    } catch (error) {
      console.error('Error fetching Google Drive documents:', error);
    }
  };

  const importFromGoogleDrive = async (driveFileId: string, fileName: string) => {
    // In a real implementation, this would download the file from Google Drive
    // and then upload it to your own backend
    console.log(`Importing file ${fileName} (${driveFileId}) from Google Drive...`);
    setIsImportingFromDrive(true);
    
    try {
      // Create a FormData object for the document
      const formData = new FormData();
      formData.append('title', fileName.replace(/\.(docx|pdf|txt)$/i, ''));
      formData.append('type', fileName.toLowerCase().includes('resolution') ? 'resolution' : 'position_paper');
      formData.append('committee', fileName.includes('UNSC') ? 'UNSC' : 
                fileName.includes('ECOSOC') ? 'ECOSOC' : 'UNEP');
      formData.append('country', 'United States'); // Default, would be determined by file content in real app
      formData.append('topic', fileName.includes('Climate') ? 'Climate Action' : 'General');
      formData.append('driveFileId', driveFileId);
      
      // Create the document in your database
      const result = await documentsAPI.createDocument(formData);
      
      // Add the new document to the list
      if (result && result[0]) {
        setDocuments(prev => [result[0], ...prev]);
      }
      
      // Show success message
      alert(`Successfully imported "${fileName}" from Google Drive`);
    } catch (error) {
      console.error('Error importing from Google Drive:', error);
      alert('Failed to import document from Google Drive.');
    } finally {
      setIsImportingFromDrive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Repository</h1>
          <div className="flex space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <Link
              href="/repository/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Document
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex flex-col lg:flex-row">
              {/* Left sidebar - filters */}
              <div className="w-full lg:w-64 mb-6 lg:mb-0">
                <div className="bg-white shadow rounded-lg p-4 sticky top-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
                  
                  {/* Document Type Filter */}
                  <div className="mb-4">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
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
                      <option value="position_paper">Position Papers</option>
                      <option value="resolution">Resolutions</option>
                      <option value="amendment">Amendments</option>
                    </select>
                  </div>
                  
                  {/* Committee Filter */}
                  <div className="mb-4">
                    <label htmlFor="committee" className="block text-sm font-medium text-gray-700 mb-1">
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
                      {committees.map((committee) => (
                        <option key={committee} value={committee}>
                          {committee}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Country Filter */}
                  <div className="mb-4">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
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
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search Query */}
                  <div className="mb-4">
                    <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search by title or topic"
                        value={filters.searchQuery}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  
                  {/* Reset Filters Button */}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Filters
                  </button>

                  {/* Google Drive Section */}
                  {isGDriveConnected && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Google Drive</h3>
                      {isImportingFromDrive ? (
                        <div className="flex items-center justify-center py-4">
                          <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Importing...</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {gDriveDocuments.length > 0 ? (
                            gDriveDocuments.map(doc => (
                              <div key={doc.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                <span className="text-sm truncate">{doc.name}</span>
                                <button
                                  onClick={() => importFromGoogleDrive(doc.id, doc.name)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Import
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No documents found in Google Drive</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Main content area */}
              <div className="lg:flex-1 lg:ml-8">
                {/* Document list */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
                    
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <>
                        {documents.length === 0 ? (
                          <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by uploading your first document.</p>
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
                          <div className="overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                              {documents.map((doc) => (
                                <DocumentListItem
                                  key={doc.id}
                                  document={doc}
                                  isSelected={selectedDoc?.id === doc.id}
                                  onClick={() => handleDocumentClick(doc)}
                                />
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Document details panel */}
                {selectedDoc && (
                  <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between items-start">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Document Details</h2>
                        <div>
                          <button
                            onClick={handleFormatCheck}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Check Format
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 border-t border-gray-200 pt-4">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Title</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedDoc.title}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Type</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedDoc.type === 'position_paper' ? 'Position Paper' : 
                               selectedDoc.type === 'resolution' ? 'Resolution' : 
                               selectedDoc.type === 'amendment' ? 'Amendment' : selectedDoc.type}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Committee</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedDoc.committee}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Country</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedDoc.country}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Topic</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedDoc.topic}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Created By</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedDoc.user.name}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Created At</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(selectedDoc.created_at).toLocaleDateString()}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Format Status</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <FormatStatus status={selectedDoc.format_status} />
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {showFormatCheck && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium text-gray-900 mb-2">Format Check Results</h3>
                          <FormatStatus status={selectedDoc.format_status} />
                        </div>
                      )}

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Document List Item Component
 * Displays a single document in the list with its metadata
 */
function DocumentListItem({ document, isSelected, onClick }: {
  document: Document;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <li 
      className={`px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {document.type === 'position_paper' ? (
              <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : document.type === 'resolution' ? (
              <svg className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ) : (
              <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{document.title}</div>
            <div className="text-sm text-gray-500">
              {document.committee} • {document.country} • {document.topic}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <FormatStatusBadge status={document.format_status} />
          <span className="ml-4 text-sm text-gray-500">
            {new Date(document.created_at).toLocaleDateString()}
          </span>
        </div>
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