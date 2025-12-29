'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ERAS, ERA_ORDER } from '@/constants/eras';
import { Era, SearchHistory } from '@/types';
import { toast } from 'sonner';
import { Sparkles, AlertCircle, Loader2, Download, Flag, Search, ExternalLink } from 'lucide-react';
import { addGeneration, linkSearchHistoryToGeneration } from '@/lib/firebase/firestore';
import { uploadImageBase64 } from '@/lib/firebase/storage';
import { generateImage } from '@/lib/gemini/client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();

  const [selectedEra, setSelectedEra] = useState<Era | ''>('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // URL 파라미터에서 시대 선택 및 검색 기록 조회
  useEffect(() => {
    const eraParam = searchParams.get('era');
    if (eraParam && ERA_ORDER.includes(eraParam as Era)) {
      setSelectedEra(eraParam as Era);
    }

    const historyId = searchParams.get('historyId');
    if (historyId) {
      loadSearchHistory(historyId);
    }
  }, [searchParams]);

  const loadSearchHistory = async (historyId: string) => {
    setIsLoadingHistory(true);
    try {
      const docRef = doc(db, 'search-history', historyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSearchHistory({
          id: docSnap.id,
          ...docSnap.data(),
        } as SearchHistory);
      } else {
        console.warn('Search history not found');
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEra || !prompt.trim()) {
      toast.error('시대와 장면 설명을 모두 입력해주세요.');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 클라이언트 사이드 Gemini API 호출
      const data = await generateImage(prompt, selectedEra, user.uid);

      if (!data.success) {
        throw new Error(data.error || '이미지 생성에 실패했습니다.');
      }

      if (data.imageBase64) {
        // 이미지 URL 생성
        const imageDataUrl = `data:image/png;base64,${data.imageBase64}`;
        setGeneratedImage(imageDataUrl);

        // Firebase Storage에 업로드
        const tempId = Date.now().toString();
        const imageUrl = await uploadImageBase64(
          user.uid,
          tempId,
          imageDataUrl
        );

        // Firestore에 저장
        const docId = await addGeneration({
          userId: user.uid,
          userDisplayName: user.displayName,
          era: selectedEra,
          prompt,
          negativePrompt: '',
          imageUrl,
          status: 'pending',
          metadata: {
            generationTime: data.generationTime || 0,
            model: data.model || 'gemini',
          },
        });

        setGenerationId(docId);

        // 검색 기록과 생성물 연결
        if (searchHistory) {
          try {
            await linkSearchHistoryToGeneration(searchHistory.id, docId);
            toast.success('이미지가 생성되고 검색 기록과 연결되었습니다!');
          } catch (linkError) {
            console.error('Failed to link search history:', linkError);
            toast.success('이미지가 생성되었습니다!');
          }
        } else {
          toast.success('이미지가 생성되었습니다!');
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : '이미지 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `korean-history-${selectedEra}-${Date.now()}.png`;
    link.click();
  };

  const selectedEraInfo = selectedEra ? ERAS[selectedEra] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">이미지 생성</h1>
        <p className="text-muted-foreground">
          시대를 선택하고 상상 속의 역사 장면을 AI로 시각화해보세요.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 입력 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              장면 설정
            </CardTitle>
            <CardDescription>
              생성하고 싶은 역사 장면을 설명해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 시대 선택 */}
            <div className="space-y-2">
              <Label htmlFor="era">시대 선택</Label>
              <Select
                value={selectedEra}
                onValueChange={(value) => setSelectedEra(value as Era)}
              >
                <SelectTrigger id="era">
                  <SelectValue placeholder="시대를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {ERA_ORDER.map((eraId) => {
                    const era = ERAS[eraId];
                    return (
                      <SelectItem key={eraId} value={eraId}>
                        {era.name} ({era.period})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 선택된 시대 정보 */}
            {selectedEraInfo && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">{selectedEraInfo.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEraInfo.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedEraInfo.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 기록 참고 자료 */}
            {isLoadingHistory ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : searchHistory && searchHistory.searchResults && searchHistory.searchResults.length > 0 ? (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 space-y-3">
                <h4 className="font-medium text-sm">참고 자료 ({searchHistory.searchResults.length}건)</h4>
                <p className="text-xs text-muted-foreground">
                  검색: &quot;{searchHistory.searchQuery}&quot;
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchHistory.searchResults.map((result, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{result.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {result.snippet}
                          </p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {result.source}
                          </Badge>
                        </div>
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 프롬프트 입력 */}
            <div className="space-y-2">
              <Label htmlFor="prompt">장면 설명</Label>
              <Textarea
                id="prompt"
                placeholder="예: 조선시대 궁궐에서 왕과 신하들이 조회를 열고 있는 모습"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                구체적으로 묘사할수록 더 정확한 이미지가 생성됩니다.
              </p>
            </div>

            {/* AI 한계 안내 */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-amber-800 dark:text-amber-200">
                <p className="font-medium">AI 생성 이미지 안내</p>
                <p className="text-xs mt-1">
                  AI가 생성한 이미지는 역사적 사실과 다를 수 있습니다.
                  실제 문화유산과 비교하여 검증해보세요.
                </p>
              </div>
            </div>

            {/* 생성 버튼 */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedEra || !prompt.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  이미지 생성
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>생성 결과</CardTitle>
            <CardDescription>
              AI가 생성한 역사 이미지가 여기에 표시됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="space-y-4">
                <Skeleton className="w-full aspect-square rounded-lg" />
                <div className="text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  이미지를 생성하고 있습니다...
                </div>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={generatedImage}
                    alt="생성된 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    다운로드
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Search className="mr-2 h-4 w-4" />
                        고증 검증
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>실제 문화유산과 비교</DialogTitle>
                        <DialogDescription>
                          문화유산 검색 페이지에서 실제 유물과 비교해보세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="pt-4">
                        <Button asChild className="w-full">
                          <a href="/student/search">문화유산 검색하기</a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>오류 보고</DialogTitle>
                        <DialogDescription>
                          이미지에서 역사적 오류를 발견하셨나요? 보고해주세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="pt-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          오류 보고 기능은 갤러리 페이지에서 이용하실 수 있습니다.
                        </p>
                        <Button asChild className="w-full">
                          <a href="/student/gallery">갤러리로 이동</a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 프롬프트 정보 */}
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">사용된 설명:</p>
                  <p className="text-muted-foreground">{prompt}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  시대를 선택하고 장면을 설명하면
                  <br />
                  AI가 이미지를 생성합니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
