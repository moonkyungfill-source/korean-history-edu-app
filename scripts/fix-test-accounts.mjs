// 테스트 계정 registrationStatus 수정 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD3GqBAW_sMok5otrEX6JFmvqQDin2vVfU",
  authDomain: "korean-history-edu-app.firebaseapp.com",
  projectId: "korean-history-edu-app",
  storageBucket: "korean-history-edu-app.firebasestorage.app",
  messagingSenderId: "787938065955",
  appId: "1:787938065955:web:88e97eba5b1ca84b5f3c24"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixAccounts() {
  const accounts = [
    { uid: 'EbX6glO70BcAxmMzNNXtArUgw0p1', email: 'student@example.com' },
    { uid: 'cN8nX6u76FcGMSA2cNm8jLit3CW2', email: 'teacher@example.com' },
  ];

  for (const account of accounts) {
    try {
      const userRef = doc(db, 'users', account.uid);
      await updateDoc(userRef, {
        registrationStatus: 'approved'
      });
      console.log(`✅ ${account.email} - registrationStatus: approved 추가됨`);
    } catch (error) {
      console.error(`❌ ${account.email} 업데이트 실패:`, error.message);
    }
  }

  console.log('\n완료! 이제 로그인해보세요.');
  process.exit(0);
}

fixAccounts();
