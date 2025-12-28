'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { AlertTriangle, Settings } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          시스템 설정 및 구성 정보입니다.
        </p>
      </div>

      {/* 시스템 구성 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            시스템 구성
          </CardTitle>
          <CardDescription>
            Firebase AI Logic을 통한 안전한 이미지 생성 및 분석
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              이미지 생성 및 분석 기능
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Firebase AI Logic을 사용하여 안전하게 이미지를 생성하고 분석합니다.
              Google Gemini 모델을 통해 역사적 이미지 생성 및 진정성 검증이 가능합니다.
            </p>
          </div>

          <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Google Search Grounding
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              학생이 업로드한 이미지의 역사적 정확성을 검증합니다.
              실시간 검색 결과와 함께 신뢰할 수 있는 분석을 제공합니다.
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-4">
            <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              API 키 관리
            </h3>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              API 키는 서버 환경 변수로 관리되며, 클라이언트에 노출되지 않습니다.
              보안상 이유로 웹 UI에서 API 키를 관리하지 않습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 보안 정보 */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            보안 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">API 키 보안:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>서버 측 관리:</strong> API 키는 서버 환경 변수로만 관리되며, 클라이언트에 절대 노출되지 않습니다.
              </li>
              <li>
                <strong>도메인 제한:</strong> Google Cloud Console에서 API 키의 도메인을 제한하세요.
                허용 도메인: korean-history-edu-app.web.app, localhost:3000 (개발용)
              </li>
              <li>
                <strong>API 한도:</strong> Google Cloud Console에서 API 할당량 한도를 설정할 수 있습니다.
              </li>
              <li>
                <strong>키 로테이션:</strong> 정기적으로 API 키를 변경하여 보안을 유지하세요.
              </li>
            </ul>
          </div>
          <Button variant="outline" asChild className="w-full">
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Cloud Console 열기
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
