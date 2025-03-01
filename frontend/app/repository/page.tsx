'use client';

import RepositoryComponent from './component';
import { AuthGuard } from '@/lib/context/AuthGuard';

export default function RepositoryPage() {
  return (
    <AuthGuard>
      <RepositoryComponent />
    </AuthGuard>
  );
} 