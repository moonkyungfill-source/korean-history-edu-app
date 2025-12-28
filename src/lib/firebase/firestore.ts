import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import {
  Generation,
  Feedback,
  ErrorReport,
  NegativePrompt,
  User,
  Era,
  GenerationStatus,
  ReportStatus,
  SearchHistory,
  ApiKeyConfig,
} from '@/types';

// ============ Generations ============

/**
 * 새 생성물 추가
 */
export async function addGeneration(
  data: Omit<Generation, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'generations'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 사용자의 생성물 목록 조회
 */
export async function getUserGenerations(userId: string): Promise<Generation[]> {
  const q = query(
    collection(db, 'generations'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Generation[];
}

/**
 * 모든 생성물 조회 (관리자용)
 */
export async function getAllGenerations(
  status?: GenerationStatus,
  limitCount: number = 50
): Promise<Generation[]> {
  let q = query(
    collection(db, 'generations'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (status) {
    q = query(
      collection(db, 'generations'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Generation[];
}

/**
 * 생성물 상태 업데이트
 */
export async function updateGenerationStatus(
  generationId: string,
  status: GenerationStatus
): Promise<void> {
  const docRef = doc(db, 'generations', generationId);
  await updateDoc(docRef, { status });
}

/**
 * 생성물 조회
 */
export async function getGeneration(generationId: string): Promise<Generation | null> {
  const docRef = doc(db, 'generations', generationId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Generation;
  }
  return null;
}

// ============ Feedback ============

/**
 * 피드백 추가
 */
export async function addFeedback(
  data: Omit<Feedback, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'feedback'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 학생의 피드백 목록 조회
 */
export async function getStudentFeedback(studentId: string): Promise<Feedback[]> {
  const q = query(
    collection(db, 'feedback'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Feedback[];
}

/**
 * 특정 생성물의 피드백 조회
 */
export async function getGenerationFeedback(generationId: string): Promise<Feedback[]> {
  const q = query(
    collection(db, 'feedback'),
    where('generationId', '==', generationId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Feedback[];
}

/**
 * 피드백 읽음 처리
 */
export async function markFeedbackAsRead(feedbackId: string): Promise<void> {
  const docRef = doc(db, 'feedback', feedbackId);
  await updateDoc(docRef, { isRead: true });
}

/**
 * 읽지 않은 피드백 개수 조회
 */
export async function getUnreadFeedbackCount(studentId: string): Promise<number> {
  const q = query(
    collection(db, 'feedback'),
    where('studentId', '==', studentId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// ============ Error Reports ============

/**
 * 오류 보고 추가
 */
export async function addErrorReport(
  data: Omit<ErrorReport, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'error-reports'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 모든 오류 보고 조회 (관리자용)
 */
export async function getAllErrorReports(
  status?: ReportStatus
): Promise<ErrorReport[]> {
  let q = query(
    collection(db, 'error-reports'),
    orderBy('createdAt', 'desc')
  );

  if (status) {
    q = query(
      collection(db, 'error-reports'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ErrorReport[];
}

/**
 * 오류 보고 상태 업데이트
 */
export async function updateErrorReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  const docRef = doc(db, 'error-reports', reportId);
  await updateDoc(docRef, { status });
}

// ============ Negative Prompts ============

/**
 * 네거티브 프롬프트 목록 조회
 */
export async function getNegativePrompts(): Promise<NegativePrompt[]> {
  const snapshot = await getDocs(collection(db, 'negative-prompts'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as NegativePrompt[];
}

/**
 * 시대별 네거티브 프롬프트 조회
 */
export async function getNegativePromptByEra(
  era: Era | 'global'
): Promise<NegativePrompt | null> {
  const q = query(
    collection(db, 'negative-prompts'),
    where('era', '==', era)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as NegativePrompt;
  }
  return null;
}

/**
 * 네거티브 프롬프트 업데이트
 */
export async function updateNegativePrompt(
  promptId: string,
  keywords: string[],
  description: string,
  updatedBy: string
): Promise<void> {
  const docRef = doc(db, 'negative-prompts', promptId);
  await updateDoc(docRef, {
    keywords,
    description,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

/**
 * 네거티브 프롬프트 추가
 */
export async function addNegativePrompt(
  era: Era | 'global',
  keywords: string[],
  description: string,
  updatedBy: string
): Promise<string> {
  const docRef = await addDoc(collection(db, 'negative-prompts'), {
    era,
    keywords,
    description,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
  return docRef.id;
}

// ============ Users (Admin) ============

/**
 * 모든 사용자 조회 (관리자용)
 */
export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
  })) as User[];
}

/**
 * 사용자 역할 업데이트
 */
export async function updateUserRole(
  userId: string,
  role: 'student' | 'admin'
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, { role });
}

/**
 * 사용자 활성화/비활성화
 */
export async function updateUserActiveStatus(
  userId: string,
  isActive: boolean
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, { isActive });
}

// ============ Statistics ============

/**
 * 생성물 통계 조회
 */
export async function getGenerationStats(): Promise<{
  total: number;
  byEra: Record<Era, number>;
  byStatus: Record<GenerationStatus, number>;
}> {
  const snapshot = await getDocs(collection(db, 'generations'));
  const generations = snapshot.docs.map((doc) => doc.data() as Generation);

  const stats = {
    total: generations.length,
    byEra: {} as Record<Era, number>,
    byStatus: {} as Record<GenerationStatus, number>,
  };

  generations.forEach((gen) => {
    stats.byEra[gen.era] = (stats.byEra[gen.era] || 0) + 1;
    stats.byStatus[gen.status] = (stats.byStatus[gen.status] || 0) + 1;
  });

  return stats;
}

// ============ Search History ============

/**
 * 검색 기록 추가
 */
export async function addSearchHistory(
  data: Omit<SearchHistory, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'search-history'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 사용자의 검색 기록 조회 (최신순)
 */
export async function getUserSearchHistory(
  userId: string,
  limitCount: number = 50
): Promise<SearchHistory[]> {
  const q = query(
    collection(db, 'search-history'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SearchHistory[];
}

/**
 * 검색 기록 삭제
 */
export async function deleteSearchHistory(historyId: string): Promise<void> {
  const docRef = doc(db, 'search-history', historyId);
  await deleteDoc(docRef);
}

/**
 * 검색 기록을 생성물과 연결
 */
export async function linkSearchHistoryToGeneration(
  historyId: string,
  generationId: string
): Promise<void> {
  const docRef = doc(db, 'search-history', historyId);
  await updateDoc(docRef, {
    usedForGeneration: true,
    generationId,
  });
}

/**
 * 미사용 검색 기록 조회 (생성에 사용하지 않은 것들)
 */
export async function getUnusedSearchHistory(userId: string): Promise<SearchHistory[]> {
  const q = query(
    collection(db, 'search-history'),
    where('userId', '==', userId),
    where('usedForGeneration', '!=', true),
    orderBy('usedForGeneration', 'desc'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SearchHistory[];
}

/**
 * 전체 검색 기록 조회 (관리자용)
 */
export async function getAllSearchHistory(limitCount: number = 100): Promise<SearchHistory[]> {
  const q = query(
    collection(db, 'search-history'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SearchHistory[];
}

// ============ User Profile ============

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  userId: string,
  profile: {
    school?: string;
    grade?: number;
    class?: string;
  }
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, profile);
}

/**
 * 프로필 완성도 확인
 * 학생: school, grade, class 모두 필수
 * 관리자: true 반환
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return false;
  }

  const user = docSnap.data() as User;

  // 관리자는 프로필 완성도 체크 없음
  if (user.role === 'admin') {
    return true;
  }

  // 학생: school, grade, class 모두 필수
  return !!(user.school && user.grade !== undefined && user.grade !== null && user.class);
}

// ============ API Key Management ============

/**
 * 앱 설정 조회 (settings/app-config)
 */
export async function getSettings(): Promise<ApiKeyConfig | null> {
  try {
    const docRef = doc(db, 'settings', 'app-config');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ApiKeyConfig;
    }
    return null;
  } catch (error) {
    console.error('설정 조회 오류:', error);
    return null;
  }
}

/**
 * API 키 업데이트 (관리자 전용)
 */
export async function updateApiKeys(
  userId: string,
  apiKeys: {
    geminiApiKey: string;
    searchApiKey?: string;
    searchEngineId?: string;
  }
): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'app-config');
    const docSnap = await getDoc(docRef);

    // 업데이트 데이터 구성 - undefined 값 명시적 제외
    const updateData: Record<string, any> = {};

    if (apiKeys.geminiApiKey) {
      updateData.geminiApiKey = apiKeys.geminiApiKey;
    }
    if (apiKeys.searchApiKey) {
      updateData.searchApiKey = apiKeys.searchApiKey;
    }
    if (apiKeys.searchEngineId) {
      updateData.searchEngineId = apiKeys.searchEngineId;
    }

    // 항상 포함되는 필드
    updateData.updatedAt = serverTimestamp();
    updateData.updatedBy = userId;

    if (docSnap.exists()) {
      // 기존 문서 업데이트
      await updateDoc(docRef, updateData);
    } else {
      // 새 문서 생성 - 필수 필드와 선택 필드를 명시적으로 분리
      const newDoc: Record<string, any> = {
        id: 'app-config',
        createdAt: serverTimestamp(),
        usageCount: 0,
        monthlyUsage: {},
        ...updateData,
      };

      await setDoc(docRef, newDoc);
    }

    return true;
  } catch (error) {
    console.error('API 키 업데이트 오류:', error);
    return false;
  }
}

/**
 * API 사용량 증가 및 월별 추적
 * @param userId 사용자 ID
 * @param usageType 사용 유형: 'imageGeneration', 'textGeneration', 'searchQueries'
 * @param cost 예상 비용 (기본값: 사용 유형별로 자동 계산)
 */
export async function incrementApiUsage(
  userId: string,
  usageType: 'imageGeneration' | 'textGeneration' | 'searchQueries',
  cost: number = 0
): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'app-config');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn('설정 문서가 없습니다. 사용량 추적이 스킵됩니다.');
      return;
    }

    const data = docSnap.data() as ApiKeyConfig;
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 월별 사용량 초기화
    const monthlyUsage = data.monthlyUsage || {};
    if (!monthlyUsage[yearMonth]) {
      monthlyUsage[yearMonth] = {
        imageGeneration: 0,
        textGeneration: 0,
        searchQueries: 0,
        totalCost: 0,
      };
    }

    // 사용량 증가
    monthlyUsage[yearMonth][usageType]++;

    // 비용 계산 (미제공 시 타입별 기본값)
    if (cost === 0) {
      switch (usageType) {
        case 'imageGeneration':
          cost = 0.05; // 예상 비용: $0.05
          break;
        case 'textGeneration':
          cost = 0.01; // 예상 비용: $0.01
          break;
        case 'searchQueries':
          cost = 0.01; // 예상 비용: $0.01
          break;
      }
    }
    monthlyUsage[yearMonth].totalCost += cost;

    // Firestore 업데이트
    await updateDoc(docRef, {
      usageCount: (data.usageCount || 0) + 1,
      lastUsedAt: serverTimestamp(),
      monthlyUsage,
    });
  } catch (error) {
    console.error('사용량 증가 오류:', error);
    // 오류가 발생해도 애플리케이션은 계속 진행 (비차단)
  }
}

/**
 * API 키 작동 테스트 (Gemini API 호출)
 */
export async function testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'API 테스트 중입니다. 간단한 응답만 해주세요.',
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: 'API 키가 정상 작동합니다.',
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: `API 테스트 실패: ${errorData.error?.message || '알 수 없는 오류'}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `API 테스트 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 월별 사용량 통계 조회
 * @param yearMonth YYYY-MM 형식
 */
export async function getMonthlyUsageStats(
  yearMonth?: string
): Promise<{
  imageGeneration: number;
  textGeneration: number;
  searchQueries: number;
  totalCost: number;
  lastUsedAt: Timestamp | null;
} | null> {
  try {
    const settings = await getSettings();
    if (!settings) return null;

    // yearMonth가 없으면 현재 월 사용
    const targetMonth = yearMonth || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    const monthlyData = settings.monthlyUsage?.[targetMonth];
    if (!monthlyData) {
      return {
        imageGeneration: 0,
        textGeneration: 0,
        searchQueries: 0,
        totalCost: 0,
        lastUsedAt: settings.lastUsedAt || null,
      };
    }

    return {
      ...monthlyData,
      lastUsedAt: settings.lastUsedAt || null,
    };
  } catch (error) {
    console.error('월별 사용량 조회 오류:', error);
    return null;
  }
}
