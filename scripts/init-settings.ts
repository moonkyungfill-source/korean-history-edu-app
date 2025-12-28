#!/usr/bin/env node

/**
 * Firestore 설정 초기화 스크립트
 * 환경 변수에서 API 키를 읽어 Firestore settings/app-config 문서를 생성합니다.
 *
 * 사용법: npm run init-settings
 */

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// .env.local 파일 로드
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ .env.local 파일을 찾을 수 없습니다.');
}

// 환경 변수에서 API 키 읽기
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const PROJECT_ID = 'korean-history-edu-app';

if (!GEMINI_API_KEY) {
  console.error('❌ NEXT_PUBLIC_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_GEMINI_API_KEY=your_key를 추가해주세요.');
  process.exit(1);
}

// Firebase Admin SDK 초기화
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-service-account.json을 찾을 수 없습니다.');
  console.error('   Firebase Console에서 서비스 계정 키를 다운로드하세요.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
} catch (error) {
  // 이미 초기화된 경우 무시
  if ((error as Error).message !== 'The default Firebase app already exists.') {
    throw error;
  }
}

const db = admin.firestore();

async function initializeSettings() {
  console.log('🔧 Firestore 설정 초기화 중...\n');

  try {
    const docRef = db.collection('settings').doc('app-config');
    const docSnap = await docRef.get();

    const now = new Date();
    const settingsData = {
      id: 'app-config',
      geminiApiKey: GEMINI_API_KEY,
      searchApiKey: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY || '',
      searchEngineId: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID || '',
      usageCount: 0,
      monthlyUsage: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system-init',
    };

    if (docSnap.exists) {
      console.log('ℹ️  설정 문서가 이미 존재합니다. 업데이트합니다...');
      await docRef.update({
        geminiApiKey: GEMINI_API_KEY,
        searchApiKey: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY || '',
        searchEngineId: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system-init',
      });
      console.log('✅ 설정 문서가 업데이트되었습니다.\n');
    } else {
      console.log('🆕 새 설정 문서를 생성합니다...');
      await docRef.set(settingsData);
      console.log('✅ 설정 문서가 생성되었습니다.\n');
    }

    console.log('📋 초기화된 설정:');
    console.log(`   Gemini API 키: ${(GEMINI_API_KEY || '').substring(0, 10)}...`);
    console.log(`   Search API 키: ${process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY ? '설정됨' : '미설정'}`);
    console.log(`   Search Engine ID: ${process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID ? '설정됨' : '미설정'}`);
    console.log('\n✅ Firestore 설정 초기화가 완료되었습니다!');

    process.exit(0);
  } catch (error) {
    console.error('❌ 설정 초기화 실패:', error);
    process.exit(1);
  }
}

// 실행
initializeSettings();
