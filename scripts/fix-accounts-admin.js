#!/usr/bin/env node
// Firebase Admin SDK with Application Default Credentials
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 환경 변수로 프로젝트 지정
process.env.GCLOUD_PROJECT = 'korean-history-edu-app';
process.env.GOOGLE_CLOUD_PROJECT = 'korean-history-edu-app';

initializeApp({
  credential: applicationDefault(),
  projectId: 'korean-history-edu-app'
});

const db = getFirestore();

async function fixAccounts() {
  const accounts = [
    { uid: 'EbX6glO70BcAxmMzNNXtArUgw0p1', email: 'student@example.com' },
    { uid: 'cN8nX6u76FcGMSA2cNm8jLit3CW2', email: 'teacher@example.com' },
  ];

  for (const account of accounts) {
    try {
      await db.collection('users').doc(account.uid).update({
        registrationStatus: 'approved'
      });
      console.log(`✅ ${account.email} - registrationStatus: approved 추가됨`);
    } catch (error) {
      console.error(`❌ ${account.email} 업데이트 실패:`, error.message);
    }
  }

  console.log('\n완료!');
}

fixAccounts().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
