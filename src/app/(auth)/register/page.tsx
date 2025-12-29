'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { registerStudent } from '@/lib/firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    displayName: '',
    school: '',
    grade: '',
    class: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.displayName) {
      newErrors.displayName = '이름을 입력해주세요.';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = '이름은 2자 이상이어야 합니다.';
    }

    if (!formData.school) {
      newErrors.school = '학교를 입력해주세요.';
    }

    if (!formData.grade) {
      newErrors.grade = '학년을 선택해주세요.';
    }

    if (!formData.class) {
      newErrors.class = '학급을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      const result = await registerStudent({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        school: formData.school,
        grade: parseInt(formData.grade),
        class: formData.class,
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // 가입 완료 화면
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
              가입 신청 완료
            </CardTitle>
            <CardDescription className="text-base mt-2">
              선생님의 승인을 기다려 주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                회원가입 신청이 완료되었습니다. 선생님이 승인하면 입력하신 이메일로 알림이 발송됩니다.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                다음 단계
              </h3>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>1. 선생님의 승인을 기다립니다.</li>
                <li>2. 승인되면 이메일 알림을 받습니다.</li>
                <li>3. 로그인하여 서비스를 이용합니다.</li>
              </ul>
            </div>

            <Button
              onClick={() => router.push('/login')}
              className="w-full"
              variant="default"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              로그인 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl">
            📝
          </div>
          <CardTitle className="text-2xl font-bold">
            학생 회원가입
          </CardTitle>
          <CardDescription className="text-base mt-2">
            AI 문화유산 생성기 가입 신청
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="text-sm font-medium">이메일 *</label>
              <Input
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isLoading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="text-sm font-medium">비밀번호 *</label>
              <Input
                type="password"
                placeholder="6자 이상"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={isLoading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="text-sm font-medium">비밀번호 확인 *</label>
              <Input
                type="password"
                placeholder="비밀번호 재입력"
                autoComplete="new-password"
                value={formData.passwordConfirm}
                onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                disabled={isLoading}
                className={errors.passwordConfirm ? 'border-red-500' : ''}
              />
              {errors.passwordConfirm && (
                <p className="text-xs text-red-500 mt-1">{errors.passwordConfirm}</p>
              )}
            </div>

            {/* 이름 */}
            <div>
              <label className="text-sm font-medium">이름 *</label>
              <Input
                type="text"
                placeholder="홍길동"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                disabled={isLoading}
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-xs text-red-500 mt-1">{errors.displayName}</p>
              )}
            </div>

            {/* 학교 */}
            <div>
              <label className="text-sm font-medium">학교 *</label>
              <Input
                type="text"
                placeholder="OO중학교"
                value={formData.school}
                onChange={(e) => handleChange('school', e.target.value)}
                disabled={isLoading}
                className={errors.school ? 'border-red-500' : ''}
              />
              {errors.school && (
                <p className="text-xs text-red-500 mt-1">{errors.school}</p>
              )}
            </div>

            {/* 학년 & 학급 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">학년 *</label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => handleChange('grade', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1학년</SelectItem>
                    <SelectItem value="2">2학년</SelectItem>
                    <SelectItem value="3">3학년</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grade && (
                  <p className="text-xs text-red-500 mt-1">{errors.grade}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">학급 *</label>
                <Input
                  type="text"
                  placeholder="1반"
                  value={formData.class}
                  onChange={(e) => handleChange('class', e.target.value)}
                  disabled={isLoading}
                  className={errors.class ? 'border-red-500' : ''}
                />
                {errors.class && (
                  <p className="text-xs text-red-500 mt-1">{errors.class}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              가입 신청
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                로그인
              </Link>
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground border-t pt-4 mt-4">
            가입 신청 후 선생님의 승인이 필요합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
