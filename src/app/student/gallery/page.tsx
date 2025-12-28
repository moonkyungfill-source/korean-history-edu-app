'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getUserGenerations, addErrorReport } from '@/lib/firebase/firestore';
import { Generation, ErrorType } from '@/types';
import { ERAS } from '@/constants/eras';
import { Image, Flag, Download, Calendar, Sparkles, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const ERROR_TYPES: { value: ErrorType; label: string }[] = [
  { value: 'costume', label: '복식 오류 (한복, 의복)' },
  { value: 'architecture', label: '건축 오류 (건물, 궁궐)' },
  { value: 'artifact', label: '유물 오류 (도자기, 그림)' },
  { value: 'anachronism', label: '시대착오 (시대에 맞지 않는 요소)' },
  { value: 'other', label: '기타' },
];

const STATUS_CONFIG = {
  pending: { label: '검토 대기', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '승인됨', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  rejected: { label: '반려됨', icon: XCircle, color: 'bg-red-100 text-red-800' },
  'revision-requested': { label: '수정 요청', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
};

export default function GalleryPage() {
  const { user } = useAuthContext();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Generation | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<ErrorType>('costume');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (user) {
      loadGenerations();
    }
  }, [user]);

  const loadGenerations = async () => {
    if (!user) return;
    try {
      const data = await getUserGenerations(user.uid);
      setGenerations(data);
    } catch (error) {
      toast.error('이미지 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (generation: Generation) => {
    try {
      const response = await fetch(generation.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `korean-history-${generation.era}-${generation.id}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('다운로드에 실패했습니다.');
    }
  };

  const handleReportSubmit = async () => {
    if (!selectedImage || !user) return;

    setSubmittingReport(true);
    try {
      await addErrorReport({
        generationId: selectedImage.id,
        userId: user.uid,
        userDisplayName: user.displayName,
        errorType: reportType,
        description: reportDescription,
        status: 'pending',
        imageUrl: selectedImage.imageUrl,
      });

      toast.success('오류 보고가 제출되었습니다.');
      setReportDialogOpen(false);
      setReportDescription('');
    } catch (error) {
      toast.error('오류 보고 제출에 실패했습니다.');
    } finally {
      setSubmittingReport(false);
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
          <h1 className="text-2xl font-bold tracking-tight">내 갤러리</h1>
          <p className="text-muted-foreground">생성한 이미지들을 확인하세요.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">내 갤러리</h1>
        <p className="text-muted-foreground">
          총 {generations.length}개의 이미지를 생성했습니다.
        </p>
      </div>

      {generations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">아직 생성한 이미지가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              이미지 생성 페이지에서 첫 번째 역사 이미지를 만들어보세요!
            </p>
            <Button asChild>
              <a href="/student/generate">
                <Sparkles className="mr-2 h-4 w-4" />
                이미지 생성하기
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => {
            const eraInfo = ERAS[generation.era];
            const statusConfig = STATUS_CONFIG[generation.status];

            return (
              <Card key={generation.id} className="overflow-hidden group">
                <div
                  className="relative aspect-square cursor-pointer"
                  onClick={() => setSelectedImage(generation)}
                >
                  <img
                    src={generation.imageUrl}
                    alt={generation.prompt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                  {/* 상태 배지 */}
                  <div className="absolute top-2 right-2">
                    <Badge className={statusConfig.color}>
                      <statusConfig.icon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{eraInfo.name}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(generation.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{generation.prompt}</p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(generation)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      저장
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(generation);
                        setReportDialogOpen(true);
                      }}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 이미지 상세 보기 다이얼로그 */}
      <Dialog open={!!selectedImage && !reportDialogOpen} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{ERAS[selectedImage.era].name} - 생성 이미지</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedImage.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-contain bg-muted"
                  />
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">사용된 설명:</p>
                  <p className="text-sm text-muted-foreground">{selectedImage.prompt}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedImage)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    다운로드
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReportDialogOpen(true)}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    오류 보고
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 오류 보고 다이얼로그 */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>오류 보고</DialogTitle>
            <DialogDescription>
              이미지에서 발견한 역사적 오류를 보고해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>오류 유형</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ErrorType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>오류 설명</Label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="어떤 부분이 역사적으로 정확하지 않은지 설명해주세요..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleReportSubmit}
                disabled={!reportDescription.trim() || submittingReport}
              >
                {submittingReport ? '제출 중...' : '보고하기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
