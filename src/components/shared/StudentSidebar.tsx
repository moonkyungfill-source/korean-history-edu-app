'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  Image,
  MessageSquare,
  Search,
  User,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/student/dashboard', icon: LayoutDashboard },
  { name: '이미지 생성', href: '/student/generate', icon: Sparkles },
  { name: '내 갤러리', href: '/student/gallery', icon: Image },
  { name: '피드백', href: '/student/feedback', icon: MessageSquare },
  { name: '프로필 설정', href: '/student/profile', icon: User },
  { name: '문화유산 검색', href: '/student/search', icon: Search },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 로고 영역 */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-2xl mr-2">🏛️</span>
        <span className="font-bold">한국사 AI</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 하단 정보 */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          한국사 AI 문화유산 생성기
        </p>
      </div>
    </div>
  );
}
