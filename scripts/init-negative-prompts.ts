import * as dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GLOBAL_NEGATIVE_PROMPTS, ERA_NEGATIVE_PROMPTS } from '../src/constants/negativePrompts';
import type { Era } from '../src/types';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

// Firebase 초기화를 위한 환경 변수 확인
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars);
  process.exit(1);
}

// Firebase Admin SDK를 위한 Service Account 설정 (환경 변수 활용)
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface NegativePromptDoc {
  era: string;
  keywords: string[];
  description: string;
  updatedAt: Date;
  updatedBy: string;
}

interface EraPromptData {
  keywords: string[];
  description: string;
}

// 시대별 설명
const eraDescriptions: Record<string, string> = {
  global: '모든 시대에 적용되는 전역 네거티브 프롬프트',
  goryeo: '고려시대 네거티브 프롬프트',
  'joseon-early': '조선시대 초기(태조~세종) 네거티브 프롬프트',
  'joseon-mid': '조선시대 중기(세조~영조) 네거티브 프롬프트',
  'joseon-late': '조선시대 후기(정조~철종) 네거티브 프롬프트',
  'japanese-occupation': '일제강점기(1910~1945) 네거티브 프롬프트',
};

async function initNegativePrompts(): Promise<void> {
  try {
    // Firebase 초기화 (Service Account 없이 REST API 사용)
    // 프로젝트에 firebase-admin이 설치되어 있지 않으면 fetch 사용
    console.log('Firestore 연결 중...');
    console.log(`프로젝트 ID: ${firebaseConfig.projectId}`);

    // REST API를 사용하여 Firestore에 접근
    const projectId = firebaseConfig.projectId;
    const apiKey = firebaseConfig.apiKey;

    // 준비할 문서들
    const documentsToCreate: Array<{ id: string; data: NegativePromptDoc }> = [];

    // 1. Global 네거티브 프롬프트
    documentsToCreate.push({
      id: 'prompt-global',
      data: {
        era: 'global',
        keywords: GLOBAL_NEGATIVE_PROMPTS,
        description: eraDescriptions.global,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
    });

    // 2. 시대별 네거티브 프롬프트
    const eras: Era[] = ['goryeo', 'joseon-early', 'joseon-mid', 'joseon-late', 'japanese-occupation'];

    for (const era of eras) {
      documentsToCreate.push({
        id: `prompt-${era}`,
        data: {
          era,
          keywords: ERA_NEGATIVE_PROMPTS[era],
          description: eraDescriptions[era],
          updatedAt: new Date(),
          updatedBy: 'system',
        },
      });
    }

    // Firestore REST API를 통해 문서 생성
    console.log(`\n${documentsToCreate.length}개의 문서를 생성합니다...`);

    for (const doc of documentsToCreate) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/negative-prompts/${doc.id}?key=${apiKey}`;

        // Firestore 서버 타임스탬프로 변환
        const dataWithTimestamp = {
          ...doc.data,
          updatedAt: {
            timestampValue: doc.data.updatedAt.toISOString(),
          },
        };

        // Firestore 문서 형식으로 변환
        const firestoreDoc = {
          fields: {
            era: { stringValue: dataWithTimestamp.era },
            keywords: {
              arrayValue: {
                values: dataWithTimestamp.keywords.map((k) => ({ stringValue: k })),
              },
            },
            description: { stringValue: dataWithTimestamp.description },
            updatedAt: { timestampValue: dataWithTimestamp.updatedAt.timestampValue },
            updatedBy: { stringValue: dataWithTimestamp.updatedBy },
          },
        };

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(firestoreDoc),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`${doc.id} 생성 실패: ${JSON.stringify(errorData)}`);
        }

        console.log(`✓ ${doc.id} 생성 완료`);
      } catch (error) {
        console.error(`✗ ${doc.id} 생성 실패:`, error);
      }
    }

    console.log('\n완료! 모든 문서가 Firestore에 저장되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('초기화 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
initNegativePrompts();
