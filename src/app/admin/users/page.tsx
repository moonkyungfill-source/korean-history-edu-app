'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { getAllUsers, updateUserRole, updateUserActiveStatus } from '@/lib/firebase/firestore';
import { User, UserRole } from '@/types';
import { Users, Search, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    setUpdating(true);
    try {
      await updateUserRole(user.uid, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, role: newRole } : u
        )
      );
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      toast.success('역할이 변경되었습니다.');
    } catch (error) {
      toast.error('역할 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleActiveStatusChange = async (user: User, isActive: boolean) => {
    setUpdating(true);
    try {
      await updateUserActiveStatus(user.uid, isActive);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, isActive } : u
        )
      );
      if (selectedUser?.uid === user.uid) {
        setSelectedUser({ ...selectedUser, isActive });
      }
      toast.success(isActive ? '계정이 활성화되었습니다.' : '계정이 비활성화되었습니다.');
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSchool = schoolFilter === 'all' || user.school === schoolFilter;
    const matchesGrade = gradeFilter === 'all' || user.grade === parseInt(gradeFilter);
    return matchesSearch && matchesRole && matchesSchool && matchesGrade;
  });

  // 고유 학교 목록 추출
  const uniqueSchools = Array.from(
    new Set(users.map((u) => u.school).filter((school) => school))
  ).sort();

  // 프로필 미완성 확인 함수
  const isProfileIncomplete = (user: User): boolean => {
    return !user.school || !user.grade || !user.class;
  };

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    admins: users.filter((u) => u.role === 'admin').length,
    active: users.filter((u) => u.isActive).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
        <p className="text-muted-foreground">
          학생과 관리자 계정을 관리하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">전체 사용자</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded bg-green-100 dark:bg-green-900/20">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.students}</div>
              <div className="text-sm text-muted-foreground">학생</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded bg-purple-100 dark:bg-purple-900/20">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.admins}</div>
              <div className="text-sm text-muted-foreground">관리자</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded bg-amber-100 dark:bg-amber-900/20">
              <UserCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-sm text-muted-foreground">활성 계정</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 역할</SelectItem>
                  <SelectItem value="student">학생</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={schoolFilter}
                onValueChange={(v) => setSchoolFilter(v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 학교</SelectItem>
                  {uniqueSchools.map((school) => (
                    <SelectItem key={school} value={school || ''}>
                      {school || '미지정'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={gradeFilter}
                onValueChange={(v) => setGradeFilter(v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 학년</SelectItem>
                  <SelectItem value="1">1학년</SelectItem>
                  <SelectItem value="2">2학년</SelectItem>
                  <SelectItem value="3">3학년</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 사용자 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>학교</TableHead>
                  <TableHead>학년/학급</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>마지막 로그인</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{user.displayName}</span>
                          {isProfileIncomplete(user) && (
                            <Badge variant="destructive" className="text-xs">
                              프로필 미완성
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.school || '-'}</TableCell>
                      <TableCell>
                        {user.grade && user.class
                          ? `${user.grade}학년 ${user.class}`
                          : '미입력'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                        >
                          {user.role === 'admin' ? '관리자' : '학생'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? 'outline' : 'destructive'}
                        >
                          {user.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          관리
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 관리 다이얼로그 */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>사용자 관리</DialogTitle>
                <DialogDescription>
                  {selectedUser.displayName}님의 계정을 관리합니다.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">이메일</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium">역할 변경</div>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(v) =>
                      handleRoleChange(selectedUser, v as UserRole)
                    }
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium">계정 상태</div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedUser.isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        handleActiveStatusChange(selectedUser, true)
                      }
                      disabled={updating || selectedUser.isActive}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-1" />
                      )}
                      활성화
                    </Button>
                    <Button
                      variant={!selectedUser.isActive ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() =>
                        handleActiveStatusChange(selectedUser, false)
                      }
                      disabled={updating || !selectedUser.isActive}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4 mr-1" />
                      )}
                      비활성화
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
