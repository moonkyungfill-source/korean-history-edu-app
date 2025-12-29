'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getPendingRegistrations,
  getRegistrationStats,
  approveRegistration,
  rejectRegistration,
} from '@/lib/firebase/firestore';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { User } from '@/types';
import { UserPlus, Clock, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function RegistrationsPage() {
  const { user } = useAuthContext();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 거절 다이얼로그 상태
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, statsData] = await Promise.all([
        getPendingRegistrations(),
        getRegistrationStats(),
      ]);
      setPendingUsers(pending);
      setStats(statsData);
    } catch (error) {
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (targetUser: User) => {
    if (!user) return;

    setProcessingId(targetUser.uid);
    try {
      await approveRegistration(targetUser.uid, user.uid);

      // UI 업데이트
      setPendingUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
      }));

      toast.success(`${targetUser.displayName}님의 가입이 승인되었습니다.`);
    } catch (error) {
      toast.error('승인 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (targetUser: User) => {
    setRejectingUser(targetUser);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingUser) return;

    setProcessingId(rejectingUser.uid);
    try {
      await rejectRegistration(rejectingUser.uid, rejectReason || undefined);

      // UI 업데이트
      setPendingUsers((prev) => prev.filter((u) => u.uid !== rejectingUser.uid));
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
      }));

      toast.success(`${rejectingUser.displayName}님의 가입이 거절되었습니다.`);
      setRejectDialogOpen(false);
      setRejectingUser(null);
    } catch (error) {
      toast.error('거절 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">가입 승인 관리</h1>
          <p className="text-muted-foreground">학생 회원가입 신청을 승인하거나 거절합니다.</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}명</div>
            <p className="text-xs text-muted-foreground">승인 대기 중인 학생</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}명</div>
            <p className="text-xs text-muted-foreground">승인된 학생</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">거절됨</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}명</div>
            <p className="text-xs text-muted-foreground">거절된 신청</p>
          </CardContent>
        </Card>
      </div>

      {/* 대기 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            가입 대기 목록
          </CardTitle>
          <CardDescription>
            승인하면 학생이 로그인하여 서비스를 이용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>승인 대기 중인 가입 신청이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>학교</TableHead>
                  <TableHead>학년/반</TableHead>
                  <TableHead>신청일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((pendingUser) => (
                  <TableRow key={pendingUser.uid}>
                    <TableCell className="font-medium">{pendingUser.displayName}</TableCell>
                    <TableCell>{pendingUser.email}</TableCell>
                    <TableCell>{pendingUser.school || '-'}</TableCell>
                    <TableCell>
                      {pendingUser.grade ? `${pendingUser.grade}학년 ${pendingUser.class || ''}` : '-'}
                    </TableCell>
                    <TableCell>{formatDate(pendingUser.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(pendingUser)}
                          disabled={processingId === pendingUser.uid}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingId === pendingUser.uid ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              승인
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(pendingUser)}
                          disabled={processingId === pendingUser.uid}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 거절 사유 입력 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>가입 신청 거절</DialogTitle>
            <DialogDescription>
              {rejectingUser?.displayName}님의 가입 신청을 거절합니다.
              거절 사유를 입력하면 학생에게 안내됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="거절 사유 (선택사항)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processingId !== null}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              거절 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
