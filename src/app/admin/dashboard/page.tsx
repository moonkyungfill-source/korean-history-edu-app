'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getGenerationStats,
  getAllGenerations,
  getAllErrorReports,
} from '@/lib/firebase/firestore';
import { Generation, ErrorReport } from '@/types';
import { ERAS } from '@/constants/eras';
import {
  Image,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGenerations: 0,
    pendingReview: 0,
    pendingReports: 0,
    byEra: {} as Record<string, number>,
  });
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [recentReports, setRecentReports] = useState<ErrorReport[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [generationStats, generations, reports] = await Promise.all([
        getGenerationStats(),
        getAllGenerations('pending', 5),
        getAllErrorReports('pending'),
      ]);

      setStats({
        totalGenerations: generationStats.total,
        pendingReview: generationStats.byStatus.pending || 0,
        pendingReports: reports.filter((r) => r.status === 'pending').length,
        byEra: generationStats.byEra,
      });

      setRecentGenerations(generations);
      setRecentReports(reports.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">관리자 대시보드</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          학생 활동과 시스템 상태를 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 생성물</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">
              학생들이 생성한 이미지
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">검토 대기</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              승인 대기 중인 생성물
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오류 보고</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              미처리 오류 보고
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인률</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalGenerations > 0
                ? Math.round(
                    ((stats.totalGenerations - stats.pendingReview) /
                      stats.totalGenerations) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              검토 완료율
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 시대별 생성물 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>시대별 생성물 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(ERAS).map(([eraId, eraInfo]) => (
              <div key={eraId} className="flex items-center gap-2">
                <Badge variant="outline">{eraInfo.name}</Badge>
                <span className="font-medium">
                  {stats.byEra[eraId] || 0}건
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 최근 검토 대기 생성물 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>검토 대기 생성물</CardTitle>
              <CardDescription>최근 생성되어 검토가 필요한 이미지</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/review">전체 보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentGenerations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                검토 대기 중인 생성물이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {recentGenerations.map((generation) => (
                  <div
                    key={generation.id}
                    className="flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={generation.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {generation.userDisplayName || '학생'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ERAS[generation.era].name} - {generation.prompt}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(generation.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 오류 보고 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>최근 오류 보고</CardTitle>
              <CardDescription>학생들이 보고한 역사적 오류</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/reports">전체 보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                처리 대기 중인 오류 보고가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start gap-4"
                  >
                    <div className="p-2 rounded bg-red-100 dark:bg-red-900/20">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {report.userDisplayName || '학생'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {report.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.errorType}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 빠른 작업 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/review">
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                  <span>생성물 검수</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/prompts">
                <div className="text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2" />
                  <span>프롬프트 관리</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/users">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <span>사용자 관리</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/settings">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                  <span>설정</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
