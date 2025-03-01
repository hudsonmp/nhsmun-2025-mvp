'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentsAPI } from '@/lib/api';

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('position_paper');
  const [committee, setCommittee] = useState('');
  const [country, setCountry] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock committees and countries for the demo
  const committees = ['UNSC', 'UNHRC', 'UNEP', 'DISEC', 'WHO', 'ECOSOC'];
  const countries = ['United States', 'China', 'Russia', 'United Kingdom', 'France', 'Germany', 'India', 'Brazil', 'Sweden', 'South Africa', 'Japan', 'Mexico'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title || !committee || !country || !topic) {
      setError('Please fill all required fields');
      return;
    }
    
    if (!file && !selectedDriveFile) {
      setError('Please upload a file or select one from Google Drive');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', documentType);
      formData.append('committee', committee);
      formData.append('country', country);
      formData.append('topic', topic);
      
      if (file) {
        formData.append('file', file);
      } else if (selectedDriveFile) {
        formData.append('driveFileId', selectedDriveFile.id);
      }
      
      // In a real implementation, this would be a multipart/form-data request
      await documentsAPI.createDocument(formData);
      
      // Redirect to repository page after successful upload
      router.push('/repository');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const openGoogleDriveModal = () => {
    setShowGoogleDriveModal(true);
    fetchGoogleDriveFiles();
  };

  const fetchGoogleDriveFiles = async () => {
    setIsLoadingDriveFiles(true);
    
    try {
      // In a real implementation, this would make an API call to Google Drive API
      // For demo purposes, we'll use mock data
      setTimeout(() => {
        const mockFiles = [
          { id: 'file1', name: 'Position Paper - UNSC.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2025-01-15T10:30:00Z' },
          { id: 'file2', name: 'Climate Change - UNEP.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2025-01-10T14:45:00Z' },
          { id: 'file3', name: 'Human Rights Position - UNHRC.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2025-01-05T09:15:00Z' },
          { id: 'file4', name: 'Nuclear Disarmament - DISEC.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2025-01-01T16:20:00Z' },
          { id: 'file5', name: 'Global Health Crisis - WHO.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2024-12-28T11:50:00Z' },
        ];
        setGoogleDriveFiles(mockFiles);
        setIsLoadingDriveFiles(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
      setIsLoadingDriveFiles(false);
    }
  };

  const selectDriveFile = (file: any) => {
    setSelectedDriveFile(file);
    setShowGoogleDriveModal(false);
    
    // Auto-fill form fields based on file name if possible
    const fileName = file.name;
    
    // Try to extract information from file name
    // This is a simple implementation and would need to be more robust in a real app
    committees.forEach(comm => {
      if (fileName.includes(comm)) {
        setCommittee(comm);
      }
    });
    
    countries.forEach(ctry => {
      if (fileName.includes(ctry)) {
        setCountry(ctry);
      }
    });
    
    if (fileName.includes('Position Paper')) {
      setDocumentType('position_paper');
    } else if (fileName.includes('Resolution')) {
      setDocumentType('resolution');
    } else if (fileName.includes('Speech')) {
      setDocumentType('speech');
    }
  };

  const filteredDriveFiles = driveSearchQuery 
    ? googleDriveFiles.filter(file => 
        file.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
      )
    : googleDriveFiles;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
          <Link href="/repository" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Return to Repository
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Document Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please fill in the details for your document
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="document-type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="position_paper">Position Paper</option>
                  <option value="resolution">Resolution</option>
                  <option value="speech">Speech</option>
                  <option value="research">Research Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="committee" className="block text-sm font-medium text-gray-700 mb-1">
                  Committee <span className="text-red-500">*</span>
                </label>
                <select
                  id="committee"
                  value={committee}
                  onChange={(e) => setCommittee(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Committee</option>
                  {committees.map((comm) => (
                    <option key={comm} value={comm}>{comm}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((ctry) => (
                    <option key={ctry} value={ctry}>{ctry}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h4>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".doc,.docx,.pdf,.txt"
                    />
                    
                    {file ? (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Selected file:</span>
                        <span className="text-base font-medium text-blue-600">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="ml-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:text-blue-500"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Click to upload
                          </button>{' '}
                          or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500">DOC, DOCX, PDF or TXT up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="relative flex items-center">
                    <div className="flex h-5 items-center">
                      <span className="text-sm font-medium text-gray-900">or</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={openGoogleDriveModal}
                    className="w-full flex justify-center items-center px-4 py-8 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {selectedDriveFile ? (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Selected from Google Drive:</span>
                        <span className="text-base font-medium text-blue-600">{selectedDriveFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriveFile(null);
                          }}
                          className="ml-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 87.3 78" className="w-6 h-6 mr-2">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                        </svg>
                        Select from Google Drive
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <Link
                href="/repository"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Google Drive file picker modal */}
      {showGoogleDriveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Select a file from Google Drive
                    </h3>
                    <div className="mt-4">
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={driveSearchQuery}
                          onChange={(e) => setDriveSearchQuery(e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      {isLoadingDriveFiles ? (
                        <div className="flex justify-center py-6">
                          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                          {filteredDriveFiles.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                              {filteredDriveFiles.map((file) => (
                                <li key={file.id} className="px-4 py-3 hover:bg-gray-50">
                                  <button
                                    type="button"
                                    className="w-full text-left"
                                    onClick={() => selectDriveFile(file)}
                                  >
                                    <div className="flex items-center">
                                      <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-500">
                              No files found matching your search
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowGoogleDriveModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 