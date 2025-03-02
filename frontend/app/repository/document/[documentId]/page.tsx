'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentAPI } from '@/lib/supabase';
import { Document } from '@/lib/document';
import { toast } from 'react-hot-toast';

/**
 * GoogleDocEmbed Component
 * 
 * This component provides an embedded view of a Google Doc within the application.
 * It fetches the document details from Supabase and creates an iframe to embed
 * the Google Doc viewer.
 */
export default function EmbeddedDocumentView({ params }: { params: { documentId: string } }) {
  const router = useRouter();
  const { documentId } = params;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocument() {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        const doc = await documentAPI.getDocument(documentId);
        setDocument(doc);
      } catch (err: any) {
        console.error('Error fetching document:', err);
        setError(`Failed to load document: ${err.message}`);
        toast.error(`Failed to load document: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [documentId]);

  // Function to generate Google Docs embed URL
  const getGoogleDocEmbedUrl = (driveFileId: string) => {
    return `https://docs.google.com/document/d/${driveFileId}/preview`;
  };

  // Format status badge component
  const FormatStatusBadge = ({ status }: { status: string | undefined }) => {
    if (!status) return null;
    
    const colors = {
      valid: 'bg-green-100 text-green-800 border-green-200',
      issues: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      not_checked: 'bg-gray-100 text-gray-800 border-gray-200',
      conflict: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    const labels = {
      valid: 'Valid Format',
      issues: 'Format Issues',
      pending: 'Format Check Pending',
      not_checked: 'Not Checked',
      conflict: 'Format Conflict'
    };
    
    const colorClass = colors[status as keyof typeof colors] || colors.not_checked;
    const label = labels[status as keyof typeof labels] || status;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with document info and actions */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
          
          {document && (
            <div className="flex-1 ml-4">
              <div className="flex items-center">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{document.title}</h1>
                <div className="ml-3">
                  <FormatStatusBadge status={document.format_status} />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {document.committee} • {document.country} • {document.type.replace('_', ' ')}
              </p>
              {document.last_synced && (
                <p className="text-xs text-gray-400 mt-1">
                  Last synced: {new Date(document.last_synced).toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          {document?.drive_file_id && (
            <div className="flex space-x-2">
              <a 
                href={`https://docs.google.com/document/d/${document.drive_file_id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit in Google Docs
              </a>
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content area with Google Doc embed */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-32 w-32 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-xl">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Return to repository
                </button>
              </div>
            </div>
          </div>
        ) : !document ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md max-w-xl">
              <h3 className="text-lg font-medium text-gray-800">Document not found</h3>
              <p className="mt-2 text-gray-700">
                The requested document could not be found.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to repository
                </button>
              </div>
            </div>
          </div>
        ) : document?.format_status === 'issues' && document.format_issues && document.format_issues.length > 0 ? (
          <div className="flex flex-col h-full">
            {/* Format issues warning banner */}
            <div className="bg-red-50 p-4 border-b border-red-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Format issues detected in this document
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {document.format_issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <a
                        href={`https://docs.google.com/document/d/${document.drive_file_id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Fix Issues in Google Docs
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Embed view */}
            <div className="flex-1">
              {document?.drive_file_id ? (
                <iframe
                  src={getGoogleDocEmbedUrl(document.drive_file_id)}
                  className="w-full h-full border-none"
                  title={document.title}
                  allowFullScreen
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-yellow-50 p-6 rounded-lg shadow-md max-w-xl">
                    <h3 className="text-lg font-medium text-yellow-800">No Google Doc available</h3>
                    <p className="mt-2 text-yellow-700">
                      This document does not have an associated Google Doc.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          document?.drive_file_id ? (
            <div className="h-full w-full">
              <iframe
                src={getGoogleDocEmbedUrl(document.drive_file_id)}
                className="w-full h-full border-none"
                title={document.title}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="bg-yellow-50 p-6 rounded-lg shadow-md max-w-xl">
                <h3 className="text-lg font-medium text-yellow-800">No Google Doc available</h3>
                <p className="mt-2 text-yellow-700">
                  This document does not have an associated Google Doc.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Return to repository
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
} 