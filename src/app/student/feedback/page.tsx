'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudentFeedback, markFeedbackAsRead, getGeneration } from '@/lib/firebase/firestore';
import { Feedback, Generation } from '@/types';
import { ERAS } from '@/constants/eras';
import { MessageSquare, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FeedbackWithGeneration extends Feedback {
  generation?: Generation;
}

export default function FeedbackPage() {
  const { user } = useAuthContext();
  const [feedbacks, setFeedbacks] = useState<FeedbackWithGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithGeneration | null>(null);

  useEffect(() => {
    if (user) {
      loadFeedbacks();
    }
  }, [user]);

  const loadFeedbacks = async () => {
    if (!user) return;
    try {
      const data = await getStudentFeedback(user.uid);

      // 각 피드백에 대한 생성물 정보 가져오기
      const feedbacksWithGenerations = await Promise.all(
        data.map(async (feedback) => {
          const generation = await getGeneration(feedback.generationId);
          return { ...feedback, generation: generation || undefined };
        })
      );

      setFeedbacks(feedbacksWithGenerations);
    } catch (error) {
      toast.error('피드백 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = async (feedback: FeedbackWithGeneration) => {
    setSelectedFeedback(feedback);

    // 읽지 않은 피드백이면 읽음 처리
    if (!feedback.isRead) {
      try {
        await markFeedbackAsRead(feedback.id);
        setFeedbacks((prev) =>
          prev.map((f) =>
            f.id === feedback.id ? { ...f, isRead: true } : f
          )
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">피드백</h1>
          <p className="text-muted-foreground">선생님의 피드백을 확인하세요.</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">피드백</h1>
          <p className="text-muted-foreground">
            총 {feedbacks.length}개의 피드백이 있습니다.
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}개 미확인
              </Badge>
            )}
          </p>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">아직 받은 피드백이 없습니다</h3>
            <p className="text-sm text-muted-foreground text-center">
              이미지를 생성하면 선생님이 피드백을 남겨주실 거예요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const generation = feedback.generation;
            const eraInfo = generation ? ERAS[generation.era] : null;

            return (
              <Card
                key={feedback.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !feedback.isRead ? 'border-primary' : ''
                }`}
                onClick={() => handleOpenFeedback(feedback)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* 이미지 썸네일 */}
                    {generation && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                        <img
                          src={generation.imageUrl}
                          alt="생성 이미지"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 피드백 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!feedback.isRead ? (
                          <Badge variant="default" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            미확인
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            확인됨
                          </Badge>
                        )}
                        {eraInfo && (
                          <Badge variant="secondary" className="text-xs">
                            {eraInfo.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(feedback.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-medium text-sm mb-1">
                        {feedback.adminDisplayName || '선생님'}의 피드백
                      </h4>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.textFeedback}
                      </p>

                      {feedback.referenceUrls && feedback.referenceUrls.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                          <ExternalLink className="h-3 w-3" />
                          <span>{feedback.referenceUrls.length}개의 참고 자료</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 피드백 상세 다이얼로그 */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedFeedback.adminDisplayName || '선생님'}의 피드백
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 원본 이미지 */}
                {selectedFeedback.generation && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={selectedFeedback.generation.imageUrl}
                      alt="생성 이미지"
                      className="w-full h-full object-contain bg-muted"
                    />
                  </div>
                )}

                {/* 피드백 텍스트 */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">피드백 내용</h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedFeedback.textFeedback}
                  </p>
                </div>

                {/* 참고 자료 */}
                {selectedFeedback.referenceUrls && selectedFeedback.referenceUrls.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">참고 자료</h4>
                    <ul className="space-y-2">
                      {selectedFeedback.referenceUrls.map((url, index) => (
                        <li key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <a href="/student/generate">새 이미지 생성</a>
                  </Button>
                  <Button asChild className="flex-1">
                    <a href="/student/gallery">갤러리로 이동</a>
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
