'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getGenerationStats, getAllUsers } from '@/lib/firebase/firestore';
import { ERAS } from '@/constants/eras';
import { BarChart3, Users, Image, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byEra: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  });
  const [userCount, setUserCount] = useState({ total: 0, students: 0, admins: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [generationStats, users] = await Promise.all([
        getGenerationStats(),
        getAllUsers(),
      ]);

      setStats(generationStats);
      setUserCount({
        total: users.length,
        students: users.filter((u) => u.role === 'student').length,
        admins: users.filter((u) => u.role === 'admin').length,
      });
    } catch (error) {
      toast.error('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">통계</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: '검토 대기',
    approved: '승인됨',
    rejected: '반려됨',
    'revision-requested': '수정 요청',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">통계</h1>
        <p className="text-muted-foreground">
          시스템 사용 현황을 확인하세요.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount.total}</div>
            <p className="text-xs text-muted-foreground">
              학생 {userCount.students} / 관리자 {userCount.admins}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 생성물</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              이미지 생성 횟수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0
                ? Math.round(
                    ((stats.byStatus.approved || 0) / stats.total) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              승인된 생성물 비율
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">인기 시대</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(stats.byEra).length > 0
                ? ERAS[
                    Object.entries(stats.byEra).sort(
                      ([, a], [, b]) => b - a
                    )[0][0] as keyof typeof ERAS
                  ]?.name || '-'
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              가장 많이 생성된 시대
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 시대별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>시대별 생성 현황</CardTitle>
          <CardDescription>각 시대별로 생성된 이미지 수</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(ERAS).map(([eraId, eraInfo]) => {
              const count = stats.byEra[eraId] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={eraId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{eraInfo.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {eraInfo.period}
                      </span>
                    </div>
                    <span className="font-medium">{count}건</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 상태별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>상태별 현황</CardTitle>
          <CardDescription>생성물의 검토 상태별 분포</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = stats.byStatus[status] || 0;

              return (
                <div
                  key={status}
                  className="p-4 rounded-lg bg-muted/50 text-center"
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
