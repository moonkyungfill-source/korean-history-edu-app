'use client';

import { useState } from 'react';
import { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface ProfileCompletionModalProps {
  isOpen: boolean;
  user: User;
  onProfileComplete: () => void;
}

export function ProfileCompletionModal({
  isOpen,
  user,
  onProfileComplete,
}: ProfileCompletionModalProps) {
  const [school, setSchool] = useState(user?.school || '');
  const [grade, setGrade] = useState(user?.grade?.toString() || '');
  const [classInput, setClassInput] = useState(user?.class || '');
  const [loading, setLoading] = useState(false);

  // 필수 입력 검증
  const isValid = school.trim() && grade && classInput.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        school: school.trim(),
        grade: parseInt(grade, 10),
        class: classInput.trim(),
      });

      toast.success('프로필이 완성되었습니다!');
      onProfileComplete();
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast.error('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">프로필 완성</DialogTitle>
          <DialogDescription>
            서비스 이용을 위해 기본 정보를 입력해주세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학교명 입력 */}
          <div className="space-y-2">
            <Label htmlFor="school">학교명 *</Label>
            <Input
              id="school"
              placeholder="예: 서울고등학교"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* 학년 선택 */}
          <div className="space-y-2">
            <Label htmlFor="grade">학년 *</Label>
            <Select value={grade} onValueChange={setGrade} disabled={loading}>
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
              required
            />
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || loading}
          >
            {loading ? '완료 중...' : '완료'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
