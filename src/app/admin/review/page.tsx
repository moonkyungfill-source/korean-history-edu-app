'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAllGenerations,
  updateGenerationStatus,
  addFeedback,
} from '@/lib/firebase/firestore';
import { Generation, GenerationStatus } from '@/types';
import { ERAS } from '@/constants/eras';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_OPTIONS: { value: GenerationStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '검토 대기' },
  { value: 'approved', label: '승인됨' },
  { value: 'rejected', label: '반려됨' },
  { value: 'revision-requested', label: '수정 요청' },
];

export default function ReviewPage() {
  const { user } = useAuthContext();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<GenerationStatus | 'all'>('pending');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGenerations();
  }, [statusFilter]);

  const loadGenerations = async () => {
    setLoading(true);
    try {
      const data = await getAllGenerations(
        statusFilter === 'all' ? undefined : statusFilter,
        100
      );
      setGenerations(data);
    } catch (error) {
      toast.error('생성물 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    generation: Generation,
    newStatus: GenerationStatus
  ) => {
    try {
      await updateGenerationStatus(generation.id, newStatus);
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === generation.id ? { ...g, status: newStatus } : g
        )
      );
      toast.success(`상태가 변경되었습니다.`);
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleAddReference = () => {
    if (referenceUrl.trim()) {
      setReferenceUrls((prev) => [...prev, referenceUrl.trim()]);
      setReferenceUrl('');
    }
  };

  const handleRemoveReference = (index: number) => {
    setReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFeedback = async () => {
    if (!selectedGeneration || !user || !feedbackText.trim()) return;

    setSubmitting(true);
    try {
      await addFeedback({
        generationId: selectedGeneration.id,
        adminId: user.uid,
        adminDisplayName: user.displayName,
        studentId: selectedGeneration.userId,
        textFeedback: feedbackText,
        annotations: [],
        referenceUrls,
        isRead: false,
      });

      // 수정 요청 상태로 변경
      await updateGenerationStatus(selectedGeneration.id, 'revision-requested');
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === selectedGeneration.id
            ? { ...g, status: 'revision-requested' }
            : g
        )
      );

      toast.success('피드백이 전송되었습니다.');
      setSelectedGeneration(null);
      setFeedbackText('');
      setReferenceUrls([]);
    } catch (error) {
      toast.error('피드백 전송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  const getStatusBadge = (status: GenerationStatus) => {
    const config = {
      pending: { label: '검토 대기', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-800' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-800' },
      'revision-requested': { label: '수정 요청', className: 'bg-blue-100 text-blue-800' },
    };
    return (
      <Badge className={config[status].className}>{config[status].label}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">생성물 검수</h1>
          <p className="text-muted-foreground">
            학생들이 생성한 이미지를 검토하고 피드백을 제공하세요.
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as GenerationStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">검수할 생성물이 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'pending'
                ? '모든 생성물이 검토되었습니다.'
                : '해당 상태의 생성물이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => (
            <Card key={generation.id} className="overflow-hidden">
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => setSelectedGeneration(generation)}
              >
                <img
                  src={generation.imageUrl}
                  alt={generation.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(generation.status)}
                </div>
              </div>

              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{ERAS[generation.era].name}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(generation.createdAt)}
                  </span>
                </div>

                <p className="text-sm font-medium">
                  {generation.userDisplayName || '학생'}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {generation.prompt}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStatusChange(generation, 'approved')}
                    disabled={generation.status === 'approved'}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    승인
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStatusChange(generation, 'rejected')}
                    disabled={generation.status === 'rejected'}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    반려
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGeneration(generation)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 피드백 다이얼로그 */}
      <Dialog
        open={!!selectedGeneration}
        onOpenChange={() => setSelectedGeneration(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedGeneration && (
            <>
              <DialogHeader>
                <DialogTitle>피드백 작성</DialogTitle>
                <DialogDescription>
                  {selectedGeneration.userDisplayName || '학생'}의 생성물에 대한 피드백을 작성하세요.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                {/* 이미지 */}
                <div className="space-y-2">
                  <Label>생성 이미지</Label>
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={selectedGeneration.imageUrl}
                      alt=""
                      className="w-full h-full object-contain bg-muted"
                    />
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">시대:</span>{' '}
                      {ERAS[selectedGeneration.era].name}
                    </p>
                    <p>
                      <span className="font-medium">프롬프트:</span>{' '}
                      {selectedGeneration.prompt}
                    </p>
                  </div>
                </div>

                {/* 피드백 입력 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>피드백 내용</Label>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="역사적 정확성, 개선점 등을 작성해주세요..."
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>참고 자료 URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={referenceUrl}
                        onChange={(e) => setReferenceUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <Button
                        variant="outline"
                        onClick={handleAddReference}
                        disabled={!referenceUrl.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {referenceUrls.length > 0 && (
                      <div className="space-y-1">
                        {referenceUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="truncate flex-1">{url}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveReference(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={!feedbackText.trim() || submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      피드백 전송
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleStatusChange(selectedGeneration, 'approved')
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      승인
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
