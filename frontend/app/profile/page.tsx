'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { AuthGuard } from '@/lib/context/AuthGuard';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileComponent />
    </AuthGuard>
  );
}

function ProfileComponent() {
  const router = useRouter();
  const { 
    user, 
    isGoogleDriveAuthenticated, 
    isGoogleDriveLoading, 
    authenticateGoogleDrive 
  } = useAuth();
  
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle Google Drive connection
  const handleConnectGoogleDrive = async () => {
    setIsConnecting(true);
    try {
      const authenticated = await authenticateGoogleDrive();
      if (authenticated) {
        toast.success('Successfully connected to Google Drive');
      } else {
        toast.error('Failed to connect to Google Drive');
      }
    } catch (error: any) {
      console.error('Google Drive connection error:', error);
      toast.error(`Failed to connect to Google Drive: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle disconnect (this would be implemented in a real app)
  const handleDisconnectGoogleDrive = () => {
    toast.success('Google Drive disconnection is not implemented in this demo');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Profile header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              User Profile
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage your MUN Connect account and connected services
            </p>
          </div>
          
          {/* Profile content */}
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* User information */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Account Information</h4>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">User ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user?.id}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Connected services */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Connected Services</h4>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  {/* Google Drive connection */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Google Drive</h5>
                      <p className="text-sm text-gray-500">
                        Connect your Google Drive account to create and edit documents
                      </p>
                    </div>
                    <div>
                      {isGoogleDriveAuthenticated ? (
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            Connected
                          </span>
                          <button
                            type="button"
                            onClick={handleDisconnectGoogleDrive}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConnectGoogleDrive}
                          disabled={isGoogleDriveLoading || isConnecting}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                          {isGoogleDriveLoading || isConnecting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </>
                          ) : 'Connect Google Drive'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Important note about Google Drive */}
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      Connect your Google Drive once to your MUN Connect profile. This will allow you to create and edit documents across the entire application without needing to authenticate on each page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back to repository button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.push('/repository')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Repository
          </button>
        </div>
      </div>
    </div>
  );
} 