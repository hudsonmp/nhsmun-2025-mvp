'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      if (loading) return;
      
      try {
        const isAuth = await checkAuth();
        
        if (!isAuth) {
          // Redirect to login if not authenticated
          router.push('/auth');
        }
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [loading, checkAuth, router]);

  // Show loading state if checking auth status
  if (loading || isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render children when authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard; 