'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: '네거티브 프롬프트', href: '/admin/prompts', icon: FileText },
  { name: '생성물 검수', href: '/admin/review', icon: CheckSquare },
  { name: '오류 보고', href: '/admin/reports', icon: AlertTriangle },
  { name: '통계', href: '/admin/stats', icon: BarChart3 },
  { name: '사용자 관리', href: '/admin/users', icon: Users },
  { name: '설정', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 로고 영역 */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-2xl mr-2">🏛️</span>
        <span className="font-bold">관리자</span>
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
          관리자 패널
        </p>
      </div>
    </div>
  );
}
