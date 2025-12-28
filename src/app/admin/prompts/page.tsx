'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getNegativePrompts,
  addNegativePrompt,
  updateNegativePrompt,
} from '@/lib/firebase/firestore';
import { NegativePrompt, Era } from '@/types';
import { ERAS, ERA_ORDER } from '@/constants/eras';
import { DEFAULT_NEGATIVE_PROMPTS } from '@/constants/negativePrompts';
import { Plus, X, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PromptsPage() {
  const { user } = useAuthContext();
  const [prompts, setPrompts] = useState<NegativePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Era | 'global'>('global');
  const [editedKeywords, setEditedKeywords] = useState<Record<Era | 'global', string[]>>({
    global: [],
    goryeo: [],
    'joseon-early': [],
    'joseon-mid': [],
    'joseon-late': [],
    'japanese-occupation': [],
  });
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await getNegativePrompts();
      setPrompts(data);

      // 편집용 상태 초기화
      const keywordMap: Record<Era | 'global', string[]> = {
        global: DEFAULT_NEGATIVE_PROMPTS.global,
        goryeo: DEFAULT_NEGATIVE_PROMPTS.goryeo || [],
        'joseon-early': DEFAULT_NEGATIVE_PROMPTS['joseon-early'] || [],
        'joseon-mid': DEFAULT_NEGATIVE_PROMPTS['joseon-mid'] || [],
        'joseon-late': DEFAULT_NEGATIVE_PROMPTS['joseon-late'] || [],
        'japanese-occupation': DEFAULT_NEGATIVE_PROMPTS['japanese-occupation'] || [],
      };

      // Firestore에서 가져온 데이터로 덮어쓰기
      data.forEach((prompt) => {
        keywordMap[prompt.era as Era | 'global'] = prompt.keywords;
      });

      setEditedKeywords(keywordMap);
    } catch (error) {
      toast.error('프롬프트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;

    setEditedKeywords((prev) => ({
      ...prev,
      [selectedTab]: [...prev[selectedTab], newKeyword.trim()],
    }));
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditedKeywords((prev) => ({
      ...prev,
      [selectedTab]: prev[selectedTab].filter((k) => k !== keyword),
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const existingPrompt = prompts.find((p) => p.era === selectedTab);

      if (existingPrompt) {
        await updateNegativePrompt(
          existingPrompt.id,
          editedKeywords[selectedTab],
          `${selectedTab === 'global' ? '전역' : ERAS[selectedTab as Era].name} 네거티브 프롬프트`,
          user.uid
        );
      } else {
        await addNegativePrompt(
          selectedTab,
          editedKeywords[selectedTab],
          `${selectedTab === 'global' ? '전역' : ERAS[selectedTab as Era].name} 네거티브 프롬프트`,
          user.uid
        );
      }

      toast.success('저장되었습니다.');
      loadPrompts();
    } catch (error) {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    const defaultKeywords =
      selectedTab === 'global'
        ? DEFAULT_NEGATIVE_PROMPTS.global
        : DEFAULT_NEGATIVE_PROMPTS[selectedTab as Era] || [];

    setEditedKeywords((prev) => ({
      ...prev,
      [selectedTab]: [...defaultKeywords],
    }));

    toast.info('기본값으로 복원되었습니다. 저장 버튼을 눌러 적용하세요.');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">네거티브 프롬프트 관리</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">네거티브 프롬프트 관리</h1>
        <p className="text-muted-foreground">
          AI 이미지 생성 시 제외할 키워드를 관리합니다. 역사적 고증 오류를 방지하는 핵심 기능입니다.
        </p>
      </div>

      {/* 안내 카드 */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
            💡 네거티브 프롬프트란?
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            AI 이미지 생성 시 포함되지 않아야 할 요소를 지정하는 키워드입니다.
            예를 들어, 한국사 이미지 생성 시 "일본식 기모노", "중국풍 건축"과 같은
            문화적 혼동을 일으키는 요소를 차단하여 역사적 정확성을 높입니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>키워드 관리</CardTitle>
          <CardDescription>
            전역 설정은 모든 시대에 적용되고, 시대별 설정은 해당 시대에만 추가로 적용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedTab}
            onValueChange={(v) => setSelectedTab(v as Era | 'global')}
          >
            <TabsList className="flex flex-wrap h-auto gap-2 mb-6">
              <TabsTrigger value="global" className="data-[state=active]:bg-primary">
                🌐 전역
              </TabsTrigger>
              {ERA_ORDER.map((eraId) => (
                <TabsTrigger
                  key={eraId}
                  value={eraId}
                  className="data-[state=active]:bg-primary"
                >
                  {ERAS[eraId].name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4">
              {/* 현재 키워드 목록 */}
              <div className="space-y-2">
                <Label>
                  현재 키워드 ({editedKeywords[selectedTab].length}개)
                </Label>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg min-h-[100px]">
                  {editedKeywords[selectedTab].length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      등록된 키워드가 없습니다.
                    </p>
                  ) : (
                    editedKeywords[selectedTab].map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* 키워드 추가 */}
              <div className="space-y-2">
                <Label htmlFor="newKeyword">새 키워드 추가</Label>
                <div className="flex gap-2">
                  <Input
                    id="newKeyword"
                    placeholder="예: chinese dragon, samurai..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  영어로 입력하는 것이 효과적입니다. Enter 키로 빠르게 추가할 수 있습니다.
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  저장
                </Button>
                <Button variant="outline" onClick={handleResetToDefault}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  기본값으로 복원
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 적용 예시 */}
      <Card>
        <CardHeader>
          <CardTitle>적용 예시</CardTitle>
          <CardDescription>
            학생이 이미지를 생성할 때 자동으로 적용되는 네거티브 프롬프트 예시입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p className="text-muted-foreground mb-2">// 학생 입력</p>
            <p className="mb-4">조선시대 궁궐에서 왕이 신하들과 회의하는 모습</p>

            <p className="text-muted-foreground mb-2">// AI에 전달되는 네거티브 프롬프트</p>
            <p className="text-xs text-muted-foreground break-all">
              {[...editedKeywords.global, ...(editedKeywords[selectedTab] || [])].join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
