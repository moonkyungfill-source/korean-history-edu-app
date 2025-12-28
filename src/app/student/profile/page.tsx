'use client';

import { useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [school, setSchool] = useState(user?.school || '');
  const [grade, setGrade] = useState(user?.grade?.toString() || '');
  const [classInput, setClassInput] = useState(user?.class || '');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <div>로그인 정보를 불러오는 중...</div>;
  }

  // 필수 입력 검증
  const isValid = school.trim() && grade && classInput.trim();

  // 변경사항 확인
  const hasChanges =
    school !== (user.school || '') ||
    grade !== (user.grade?.toString() || '') ||
    classInput !== (user.class || '');

  const handleSave = async () => {
    if (!isValid) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    if (!hasChanges) {
      toast.info('변경된 내용이 없습니다.');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        school: school.trim(),
        grade: parseInt(grade, 10),
        class: classInput.trim(),
      });

      toast.success('프로필이 저장되었습니다!');
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast.error('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSchool(user?.school || '');
    setGrade(user?.grade?.toString() || '');
    setClassInput(user?.class || '');
  };

  // 타임스탬프를 Date로 변환
  const createdDate = user.createdAt
    ? new Date(user.createdAt.seconds * 1000)
    : null;
  const lastLoginDate = user.lastLoginAt
    ? new Date(user.lastLoginAt.seconds * 1000)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 페이지 제목 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">프로필 설정</h1>
        <p className="text-muted-foreground">
          계정 정보를 확인하고 기본 정보를 수정할 수 있습니다.
        </p>
      </div>

      {/* 섹션 1: 계정 정보 (읽기 전용) */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
          <CardDescription>
            계정 정보는 읽기 전용입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={user.displayName || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 가입일 */}
          <div className="space-y-2">
            <Label htmlFor="createdAt">가입일</Label>
            <Input
              id="createdAt"
              value={
                createdDate
                  ? format(createdDate, 'PPP p', { locale: ko })
                  : '정보 없음'
              }
              disabled
              className="bg-muted"
            />
          </div>

          {/* 마지막 로그인 */}
          <div className="space-y-2">
            <Label htmlFor="lastLogin">마지막 로그인</Label>
            <Input
              id="lastLogin"
              value={
                lastLoginDate
                  ? format(lastLoginDate, 'PPP p', { locale: ko })
                  : '정보 없음'
              }
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* 섹션 2: 기본 정보 (편집 가능) */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            학교, 학년, 학급 정보를 수정할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 학교명 입력 */}
            <div className="space-y-2">
              <Label htmlFor="school">학교명 *</Label>
              <Input
                id="school"
                placeholder="예: 서울고등학교"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* 학년 선택 */}
            <div className="space-y-2">
              <Label htmlFor="grade">학년 *</Label>
              <Select
                value={grade}
                onValueChange={setGrade}
                disabled={loading}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="학년을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1학년</SelectItem>
                  <SelectItem value="2">2학년</SelectItem>
                  <SelectItem value="3">3학년</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 학급 입력 */}
            <div className="space-y-2">
              <Label htmlFor="class">학급 *</Label>
              <Input
                id="class"
                placeholder="예: 1반"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!isValid || loading || !hasChanges}
              >
                {loading ? '저장 중...' : '저장'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                취소
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
