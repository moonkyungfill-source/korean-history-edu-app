'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin, isStudent } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        if (isAdmin) {
          router.push('/admin/dashboard');
        } else if (isStudent) {
          router.push('/student/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [loading, isAuthenticated, isAdmin, isStudent, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="text-6xl mb-4">🏛️</div>
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  );
}
