'use client';

import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Sparkles, Image, MessageSquare, Search, ArrowRight } from 'lucide-react';
import { ERAS, ERA_ORDER } from '@/constants/eras';

export default function StudentDashboard() {
  const { user } = useAuthContext();

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          안녕하세요, {user?.displayName}님! 👋
        </h1>
        <p className="text-muted-foreground">
          AI와 함께 한국 역사 문화유산을 탐험해보세요.
        </p>
      </div>

      {/* 빠른 시작 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            이미지 생성하기
          </CardTitle>
          <CardDescription>
            시대를 선택하고 상상 속의 역사 장면을 AI로 시각화해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {ERA_ORDER.map((eraId) => {
              const era = ERAS[eraId];
              return (
                <Link key={eraId} href={`/student/generate?era=${eraId}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">
                        {eraId === 'goryeo' && '🏺'}
                        {eraId === 'joseon-early' && '📜'}
                        {eraId === 'joseon-mid' && '⚔️'}
                        {eraId === 'joseon-late' && '🎨'}
                        {eraId === 'japanese-occupation' && '🕯️'}
                      </div>
                      <h3 className="font-medium text-sm">{era.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {era.period}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 주요 기능 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-500" />
              내 갤러리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              생성한 이미지들을 확인하고 관리하세요.
            </p>
            <Link href="/student/gallery">
              <Button variant="outline" size="sm" className="w-full">
                갤러리 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              피드백
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              선생님의 피드백을 확인하세요.
            </p>
            <Link href="/student/feedback">
              <Button variant="outline" size="sm" className="w-full">
                피드백 확인
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-500" />
              문화유산 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              실제 문화유산과 비교해보세요.
            </p>
            <Link href="/student/search">
              <Button variant="outline" size="sm" className="w-full">
                검색하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 학습 팁 */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-lg">💡 학습 팁</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <span>이미지 생성 시 구체적인 장면을 묘사하면 더 정확한 결과를 얻을 수 있어요.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <span>생성된 이미지는 AI가 만든 것이므로, 실제 문화유산과 비교하여 검증해보세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <span>고증 오류가 발견되면 오류 보고 기능을 사용해주세요. 함께 정확한 역사를 배워요!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
