#!/usr/bin/env node

/**
 * 테스트 계정 생성 스크립트
 * 선생님과 학생 테스트 계정을 자동으로 생성합니다.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Firebase Admin SDK 초기화
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-service-account.json을 찾을 수 없습니다.');
  console.error('Firebase Console에서 서비스 계정 키를 다운로드하세요.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'korean-history-edu-app'
});

const auth = admin.auth();
const db = admin.firestore();

// 테스트 계정 정보
const TEST_ACCOUNTS = {
  teacher: {
    email: 'teacher@example.com',
    password: 'teacher123456',
    displayName: '김선생님 (테스트)',
    role: 'admin'
  },
  student: {
    email: 'student@example.com',
    password: 'student123456',
    displayName: '이학생 (테스트)',
    role: 'student'
  }
};

async function createTestAccounts() {
  console.log('🔧 테스트 계정 생성 시작...\n');

  for (const [key, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      console.log(`⏳ ${account.displayName} 계정 생성 중...`);

      // Firebase Auth에서 기존 계정 확인
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(account.email);
        console.log(`   ℹ️ 이미 존재하는 계정입니다. (UID: ${userRecord.uid})`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // 계정이 없으면 생성
          userRecord = await auth.createUser({
            email: account.email,
            password: account.password,
            displayName: account.displayName
          });
          console.log(`   ✅ Firebase Auth 계정 생성 완료 (UID: ${userRecord.uid})`);
        } else {
          throw error;
        }
      }

      // Firestore에 사용자 정보 저장
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        await userDocRef.set({
          uid: userRecord.uid,
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true
        });
        console.log(`   ✅ Firestore 사용자 정보 저장 완료\n`);
      } else {
        console.log(`   ℹ️ Firestore에 이미 존재하는 사용자입니다.\n`);
      }

      // 계정 정보 출력
      console.log(`📋 ${account.displayName} 정보:`);
      console.log(`   이메일: ${account.email}`);
      console.log(`   비밀번호: ${account.password}`);
      console.log(`   역할: ${account.role === 'admin' ? '선생님(관리자)' : '학생'}`);
      console.log(`   UID: ${userRecord.uid}\n`);

    } catch (error) {
      console.error(`❌ ${account.displayName} 계정 생성 실패:`);
      console.error(`   ${error.message}\n`);
    }
  }

  console.log('✅ 테스트 계정 생성 완료!');
  console.log('\n📝 사용 방법:');
  console.log('1. 로그인 페이지 방문: https://korean-history-edu-app.web.app/login');
  console.log('2. "이메일" 탭 선택');
  console.log('3. 위의 테스트 계정 정보로 로그인\n');

  process.exit(0);
}

// 실행
createTestAccounts().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});
