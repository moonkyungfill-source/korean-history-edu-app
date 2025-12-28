'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { getAllErrorReports, updateErrorReportStatus, getGeneration } from '@/lib/firebase/firestore';
import { ErrorReport, ReportStatus, Generation } from '@/types';
import { AlertTriangle, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_OPTIONS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기 중' },
  { value: 'reviewed', label: '검토 완료' },
  { value: 'resolved', label: '해결됨' },
];

const ERROR_TYPE_LABELS: Record<string, string> = {
  costume: '복식 오류',
  architecture: '건축 오류',
  artifact: '유물 오류',
  anachronism: '시대착오',
  other: '기타',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [relatedGeneration, setRelatedGeneration] = useState<Generation | null>(null);

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getAllErrorReports(
        statusFilter === 'all' ? undefined : statusFilter
      );
      setReports(data);
    } catch (error) {
      toast.error('오류 보고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: ErrorReport) => {
    setSelectedReport(report);
    try {
      const generation = await getGeneration(report.generationId);
      setRelatedGeneration(generation);
    } catch (error) {
      console.error('Failed to load generation:', error);
    }
  };

  const handleStatusChange = async (report: ErrorReport, newStatus: ReportStatus) => {
    try {
      await updateErrorReportStatus(report.id, newStatus);
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, status: newStatus } : r
        )
      );
      if (selectedReport?.id === report.id) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      toast.success('상태가 변경되었습니다.');
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  const getStatusBadge = (status: ReportStatus) => {
    const config = {
      pending: { label: '대기 중', className: 'bg-yellow-100 text-yellow-800' },
      reviewed: { label: '검토 완료', className: 'bg-blue-100 text-blue-800' },
      resolved: { label: '해결됨', className: 'bg-green-100 text-green-800' },
    };
    return (
      <Badge className={config[status].className}>{config[status].label}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">오류 보고</h1>
          <p className="text-muted-foreground">
            학생들이 보고한 역사적 오류를 확인하고 처리하세요.
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReportStatus | 'all')}
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">오류 보고가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'pending'
                ? '처리 대기 중인 보고가 없습니다.'
                : '해당 상태의 보고가 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div className="p-2 rounded bg-red-100 dark:bg-red-900/20 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(report.status)}
                      <Badge variant="outline">
                        {ERROR_TYPE_LABELS[report.errorType] || report.errorType}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <p className="font-medium text-sm mb-1">
                      {report.userDisplayName || '학생'}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  </div>

                  {/* 액션 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      상세
                    </Button>
                    {report.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(report, 'reviewed')}
                      >
                        검토 완료
                      </Button>
                    )}
                    {report.status === 'reviewed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(report, 'resolved')}
                      >
                        해결됨
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>오류 보고 상세</DialogTitle>
                <DialogDescription>
                  {selectedReport.userDisplayName || '학생'}이 보고한 오류입니다.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* 관련 이미지 */}
                {relatedGeneration && (
                  <div>
                    <h4 className="font-medium mb-2">관련 이미지</h4>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={relatedGeneration.imageUrl}
                        alt=""
                        className="w-full h-full object-contain bg-muted"
                      />
                    </div>
                  </div>
                )}

                {/* 보고 정보 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-1">오류 유형</h4>
                    <Badge variant="outline">
                      {ERROR_TYPE_LABELS[selectedReport.errorType] ||
                        selectedReport.errorType}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">상태</h4>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-1">상세 설명</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedReport.description}
                  </p>
                </div>

                {/* 상태 변경 버튼 */}
                <div className="flex gap-2 pt-4">
                  {selectedReport.status === 'pending' && (
                    <Button
                      onClick={() => handleStatusChange(selectedReport, 'reviewed')}
                      className="flex-1"
                    >
                      검토 완료로 변경
                    </Button>
                  )}
                  {selectedReport.status === 'reviewed' && (
                    <Button
                      onClick={() => handleStatusChange(selectedReport, 'resolved')}
                      className="flex-1"
                    >
                      해결됨으로 변경
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReport(null)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
