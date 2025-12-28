'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ExternalLink, Upload, Image, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { ERAS, ERA_ORDER } from '@/constants/eras';
import { SearchResult } from '@/types';
import { searchHeritage } from '@/lib/search/client';
import { addSearchHistory } from '@/lib/firebase/firestore';
import { useAuthContext } from '@/components/providers/AuthProvider';

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [selectedEra, setSelectedEra] = useState<string>('');
  const [lastSearchHistoryId, setLastSearchHistoryId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setResults([]);
    setAiAnswer('');
    setLastSearchHistoryId(null);

    try {
      // 시대 정보를 검색어에 추가
      let query = searchQuery;
      if (selectedEra) {
        const eraInfo = ERAS[selectedEra as keyof typeof ERAS];
        query = `${eraInfo.name} ${searchQuery} 문화유산`;
      } else {
        query = `${searchQuery} 한국 문화유산`;
      }

      // 클라이언트 사이드 검색 API 호출
      const data = await searchHeritage(query, user?.uid);

      if (!data.success) {
        throw new Error(data.error || '검색에 실패했습니다.');
      }

      setResults(data.results || []);
      setAiAnswer(data.answer || '');

      if (data.results?.length === 0) {
        toast.info('검색 결과가 없습니다. 다른 검색어를 시도해보세요.');
      }

      // 검색 기록 저장
      if (user) {
        try {
          const historyId = await addSearchHistory({
            userId: user.uid,
            userDisplayName: user.displayName,
            searchQuery: searchQuery,
            searchResults: data.results || [],
          });
          setLastSearchHistoryId(historyId);
          toast.success('검색 기록이 저장되었습니다.');
        } catch (historyError) {
          console.error('Failed to save search history:', historyError);
          toast.error('검색 기록 저장에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : '검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 추천 검색어
  const suggestedQueries = [
    '경복궁',
    '고려청자',
    '한복',
    '세종대왕',
    '이순신',
    '팔만대장경',
    '불국사',
    '석굴암',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">문화유산 검색</h1>
        <p className="text-muted-foreground">
          실제 문화유산 자료를 검색하여 AI 생성 이미지와 비교해보세요.
        </p>
      </div>

      {/* 검색 영역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            문화유산 검색
          </CardTitle>
          <CardDescription>
            검색어를 입력하면 국립박물관, 문화재청 등의 공인 자료를 검색합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 시대 선택 (선택사항) */}
          <div className="space-y-2">
            <Label>시대 선택 (선택사항)</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedEra === '' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedEra('')}
              >
                전체
              </Badge>
              {ERA_ORDER.map((eraId) => (
                <Badge
                  key={eraId}
                  variant={selectedEra === eraId ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedEra(eraId)}
                >
                  {ERAS[eraId].name}
                </Badge>
              ))}
            </div>
          </div>

          {/* 검색 입력 */}
          <div className="flex gap-2">
            <Input
              placeholder="예: 조선시대 왕비의 한복, 고려청자..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 추천 검색어 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">추천 검색어</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query) => (
                <Badge
                  key={query}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => {
                    setSearchQuery(query);
                    handleSearch();
                  }}
                >
                  {query}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 검색 결과 */}
      {isSearching ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">AI가 문화유산 정보를 검색하고 있습니다...</span>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {/* AI 답변 */}
          {aiAnswer && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI 검색 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiAnswer}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                참고 자료 ({results.length}건)
              </h2>
              {lastSearchHistoryId && (
                <Button
                  onClick={() => router.push(`/student/generate?historyId=${lastSearchHistoryId}`)}
                  size="sm"
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  생성에 사용
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <Card key={index} className="overflow-hidden">
                  {result.thumbnailUrl ? (
                    <div className="aspect-video relative">
                      <img
                        src={result.thumbnailUrl}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-medium line-clamp-2">{result.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.snippet}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="outline" className="text-xs">
                        {result.source}
                      </Badge>
                      <a
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : searchQuery && !isSearching ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">검색 결과가 없습니다</h3>
            <p className="text-sm text-muted-foreground text-center">
              다른 검색어로 시도해보세요.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* 참고 안내 */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 검색 팁
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• 구체적인 유물명이나 시대를 함께 검색하면 더 정확한 결과를 얻을 수 있어요.</li>
            <li>• AI 생성 이미지와 실제 문화유산을 비교하며 역사적 정확성을 확인해보세요.</li>
            <li>• 국립중앙박물관, 국립고궁박물관 등 공인 기관의 자료를 참고하세요.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
