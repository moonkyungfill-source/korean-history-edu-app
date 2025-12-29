'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithEmail } from '@/lib/firebase/auth';

type LoginRole = 'student' | 'teacher';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, isAuthenticated, isAdmin, isStudent } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>('student');

  // 이메일 로그인
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isStudent) {
        router.push('/student/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, isStudent, router, user]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const user = await signIn();
      if (user) {
        // 역할 확인
        if (selectedRole === 'teacher' && user.role !== 'admin') {
          toast.error('선생님 계정이 아닙니다. 학생 로그인을 이용해주세요.');
          return;
        }
        if (selectedRole === 'student' && user.role === 'admin') {
          toast.error('학생 계정이 아닙니다. 선생님 로그인을 이용해주세요.');
          return;
        }

        toast.success(`환영합니다, ${user.displayName}님!`);
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
    } catch (error: any) {
      if (error.message === 'registration-pending') {
        toast.error('승인 대기 중입니다. 선생님의 승인을 기다려 주세요.');
      } else if (error.message === 'registration-rejected') {
        toast.error('가입 신청이 거절되었습니다. 선생님께 문의해 주세요.');
      } else {
        toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await signInWithEmail(email, password);
      if (user) {
        // 역할 확인
        if (selectedRole === 'teacher' && user.role !== 'admin') {
          toast.error('선생님 계정이 아닙니다. 학생 로그인을 이용해주세요.');
          return;
        }
        if (selectedRole === 'student' && user.role === 'admin') {
          toast.error('학생 계정이 아닙니다. 선생님 로그인을 이용해주세요.');
          return;
        }

        toast.success(`환영합니다, ${user.displayName}님!`);
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
    } catch (error: any) {
      let errorMessage = '로그인에 실패했습니다.';

      if (error.message === 'registration-pending') {
        errorMessage = '승인 대기 중입니다. 선생님의 승인을 기다려 주세요.';
      } else if (error.message === 'registration-rejected') {
        errorMessage = '가입 신청이 거절되었습니다. 선생님께 문의해 주세요.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = '가입되지 않은 계정입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 틀렸습니다.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = '이메일 또는 비밀번호가 틀렸습니다.';
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 역할 변경 시 입력 초기화
  const handleRoleChange = (role: string) => {
    setSelectedRole(role as LoginRole);
    setEmail('');
    setPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl">
            🏛️
          </div>
          <CardTitle className="text-2xl font-bold">
            한국사 AI 문화유산 생성기
          </CardTitle>
          <CardDescription className="text-base mt-2">
            AI로 역사를 시각화하고 배워보세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 역할 선택 탭 */}
          <Tabs value={selectedRole} onValueChange={handleRoleChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="student" className="flex items-center gap-2 h-12">
                <GraduationCap className="h-5 w-5" />
                <span className="font-medium">학생 로그인</span>
              </TabsTrigger>
              <TabsTrigger value="teacher" className="flex items-center gap-2 h-12">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">선생님 로그인</span>
              </TabsTrigger>
            </TabsList>

            {/* 학생 로그인 */}
            <TabsContent value="student" className="space-y-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  학생용 기능
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 시대별 역사 이미지 AI 생성</li>
                  <li>• 실제 문화유산과 비교 검증</li>
                  <li>• 선생님의 피드백 확인</li>
                </ul>
              </div>

              {/* 이메일 로그인 폼 */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="student@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <GraduationCap className="h-5 w-5 mr-2" />
                  )}
                  학생 로그인
                </Button>
              </form>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              {/* Google 로그인 */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 text-base"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Google로 로그인
              </Button>

              {/* 회원가입 링크 */}
              <div className="text-center border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  계정이 없으신가요?{' '}
                  <Link href="/register" className="text-blue-600 hover:underline font-medium">
                    학생 회원가입
                  </Link>
                </p>
              </div>
            </TabsContent>

            {/* 선생님 로그인 */}
            <TabsContent value="teacher" className="space-y-4 mt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  선생님용 기능
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• 학생 가입 승인 관리</li>
                  <li>• 생성물 검수 및 피드백</li>
                  <li>• 네거티브 프롬프트 관리</li>
                  <li>• 통계 및 사용자 관리</li>
                </ul>
              </div>

              {/* 이메일 로그인 폼 */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="teacher@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-amber-600 hover:bg-amber-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <BookOpen className="h-5 w-5 mr-2" />
                  )}
                  선생님 로그인
                </Button>
              </form>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              {/* Google 로그인 */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 text-base"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Google로 로그인
              </Button>

              {/* 안내 문구 */}
              <div className="text-center border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  선생님 계정은 관리자가 직접 생성합니다.<br />
                  계정이 필요하시면 관리자에게 문의해주세요.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground pt-2">
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
