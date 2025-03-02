'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import LandingPage from './landing-page/page';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only redirect to repository if user explicitly navigates to /auth while authenticated
    if (isAuthenticated && window.location.pathname === '/auth') {
      router.push('/repository');
    }
  }, [isAuthenticated, router]);

  // Always show landing page at root URL
  return <LandingPage />;
}