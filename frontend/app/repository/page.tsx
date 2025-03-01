'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Repository Page Component for MUN Connect
 * 
 * Features:
 * - Document listing with filtering
 * - Document details view
 * - Document format checking
 * - Search functionality
 */
export default function RepositoryPage() {
  // State Management
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    committee: 'all',
    country: 'all',
    searchQuery: '',
  });
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showFormatCheck, setShowFormatCheck] = useState(false);

  // Mock data for development and demos
  const committees = ['UNSC', 'UNHRC', 'UNEP', 'DISEC', 'WHO', 'ECOSOC'];
  const countries = ['United States', 'China', 'Russia', 'United Kingdom', 'France', 'Germany', 'India', 'Brazil'];
  
  // Sample documents data
  const mockDocuments = [
    {
      id: '1',
      title: 'Climate Change Position Paper',
      type: 'position_paper',
      committee: 'UNEP',
      country: 'Sweden',
      topic: 'Climate Change',
      created_at: '2025-02-15T12:00:00Z',
      user: { name: 'Alex Johnson' },
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
      user: { name: 'Sarah Park' },
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
      user: { name: 'Raj Patel' },
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
      user: { name: 'Maria Rodriguez' },
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
      user: { name: 'Jean Dupont' },
      format_status: 'issues',
    },
  ];

  // Load documents (simulating API fetch)
  useEffect(() => {
    const loadData = async () => {
      // In a real app, this would be a fetch call to an API endpoint
      // Example: const response = await fetch('/api/documents');
      // const data = await response.json();
      
      // Simulate network delay
      setTimeout(() => {
        setDocuments(mockDocuments);
        setIsLoading(false);
      }, 800);
    };

    loadData();
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
  const filteredDocuments = documents.filter((doc: any) => {
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
  const handleDocumentClick = (doc: any) => {
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
          format_status: Math.random() > 0.5 ? 'valid' : 'issues' 
        };
        setSelectedDoc(updatedDoc);
        
        // Also update in the documents list
        setDocuments((docs: any) => 
          docs.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Home
            </Link>
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 font-medium">Document Repository</span>
          </div>
        </div>
      </div>

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
            <Link
              href="/upload"
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
                    <option value="position_paper">Position Paper</option>
                    <option value="resolution">Resolution</option>
                    <option value="speech">Speech</option>
                    <option value="research">Research Notes</option>
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
                    {committees.map(committee => (
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
                    {countries.map(country => (
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
                {filteredDocuments.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Showing {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                  </p>
                )}
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
                <div className="px-4 py-6 sm:px-6 text-center text-gray-500">
                  No documents found matching your filters.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc: any) => (
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
                      onClick={() => window.open(`/documents/${selectedDoc.id}`, '_blank')}
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
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
    </div>
  );
}

/**
 * Document List Item Component
 * Displays a single document in the list with its metadata
 */
function DocumentListItem({ document, isSelected, onClick }: {
  document: any;
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