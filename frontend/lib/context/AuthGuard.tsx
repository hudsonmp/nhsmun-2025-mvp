'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, loading, user, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      if (loading) return;
      
      try {
        // First check context auth state
        if (isAuthenticated && user) {
          setIsChecking(false);
          return; // Already authenticated in context
        }
        
        // Double-check with Supabase directly as a fallback
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Session exists in Supabase, update context
          await checkAuth();
          setIsChecking(false);
        } else {
          // No active session, redirect to login
          console.log('No authenticated session found, redirecting to login');
          router.push('/auth');
        }
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [loading, isAuthenticated, user, checkAuth, router]);

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