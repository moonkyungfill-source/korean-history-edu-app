'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Header } from '@/components/shared/Header';
import { StudentSidebar } from '@/components/shared/StudentSidebar';
import { ProfileCompletionModal } from '@/components/shared/ProfileCompletionModal';
import { isProfileComplete } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated, isStudent, isAdmin } = useAuthContext();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isStudent && !isAdmin) {
        // 학생과 관리자만 접근 가능 (선생님은 학생 화면 모니터링 가능)
        router.push('/admin/dashboard');
      } else {
        // 프로필 완성도 확인
        checkProfileCompletion();
      }
    }
  }, [loading, isAuthenticated, isStudent, isAdmin, router]);

  const checkProfileCompletion = async () => {
    if (!user) return;
    try {
      const complete = await isProfileComplete(user.uid);
      setShowProfileModal(!complete);
    } catch (error) {
      console.error('프로필 완성도 확인 중 오류:', error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (!isStudent && !isAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header sidebarContent={<StudentSidebar />} />
      <div className="flex">
        {/* 데스크톱 사이드바 */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-14 border-r">
          <StudentSidebar />
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 md:pl-64">
          <div className="container py-6 px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* 프로필 완성 모달 */}
      {user && (
        <ProfileCompletionModal
          isOpen={showProfileModal}
          user={user}
          onProfileComplete={handleProfileComplete}
        />
      )}
    </div>
  );
}
