import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, RegistrationStatus } from '@/types';

const googleProvider = new GoogleAuthProvider();

/**
 * Google 로그인
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Firestore에서 사용자 정보 확인 또는 생성
    const user = await getOrCreateUser(firebaseUser, 'google');
    return user;
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw error;
  }
}

/**
 * 이메일/비밀번호로 로그인
 * 승인된 사용자만 로그인 가능
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User | null> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    // 사용자 정보 조회 또는 생성
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userData: User;

    if (userSnap.exists()) {
      userData = userSnap.data() as User;

      // 승인 상태 확인 (admin은 항상 승인)
      if (userData.role !== 'admin' && userData.registrationStatus !== 'approved') {
        // 로그아웃 처리
        await firebaseSignOut(auth);

        if (userData.registrationStatus === 'pending') {
          throw new Error('registration-pending');
        } else if (userData.registrationStatus === 'rejected') {
          throw new Error('registration-rejected');
        }
      }

      // 기존 사용자 - 마지막 로그인 시간 업데이트
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });
    } else {
      // 새 사용자 생성 (이메일 로그인으로 생성된 경우)
      // teacher@example.com과 moonkyungfill@gmail.com은 선생님(admin)
      const userRole: UserRole = (email === 'teacher@example.com' || email === 'moonkyungfill@gmail.com') ? 'admin' : 'student';
      const registrationStatus: RegistrationStatus = userRole === 'admin' ? 'approved' : 'pending';
      userData = await createUserDocument(firebaseUser, firebaseUser.displayName || email.split('@')[0], userRole, undefined, registrationStatus);

      // 학생은 승인 전까지 로그인 불가
      if (userRole === 'student') {
        await firebaseSignOut(auth);
        throw new Error('registration-pending');
      }
    }

    return userData;
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
}

/**
 * 선생님이 학생 계정 생성 (관리자 기능)
 * 선생님이 생성하는 계정은 바로 승인됨
 */
export async function createStudentAccount(
  email: string,
  password: string,
  displayName: string
): Promise<{ email: string; uid: string } | null> {
  try {
    // Firebase Auth에서 사용자 생성
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    // Firestore에 사용자 정보 생성 (student 역할, 승인됨 상태)
    await createUserDocument(firebaseUser, displayName, 'student', undefined, 'approved');

    return {
      email: firebaseUser.email || email,
      uid: firebaseUser.uid,
    };
  } catch (error) {
    console.error('학생 계정 생성 오류:', error);
    throw error;
  }
}

/**
 * 학생 회원가입 (자가 등록)
 * 승인 대기 상태로 생성됨
 */
export interface StudentRegistrationData {
  email: string;
  password: string;
  displayName: string;
  school: string;
  grade: number;
  class: string;
}

export async function registerStudent(
  data: StudentRegistrationData
): Promise<{ success: boolean; message: string }> {
  try {
    // Firebase Auth에서 사용자 생성
    const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = result.user;

    // Firestore에 사용자 문서 생성 (승인 대기 상태)
    const userRef = doc(db, 'users', firebaseUser.uid);
    const newUser = {
      uid: firebaseUser.uid,
      email: data.email,
      displayName: data.displayName,
      role: 'student' as UserRole,
      createdAt: serverTimestamp(),
      lastLoginAt: null,
      isActive: false, // 승인 전까지 비활성
      school: data.school,
      grade: data.grade,
      class: data.class,
      registrationStatus: 'pending' as RegistrationStatus,
    };

    await setDoc(userRef, newUser);

    // 바로 로그아웃 (승인 전까지 로그인 불가)
    await firebaseSignOut(auth);

    return {
      success: true,
      message: '가입 신청이 완료되었습니다. 선생님의 승인을 기다려 주세요.',
    };
  } catch (error: any) {
    console.error('학생 회원가입 오류:', error);

    // Firebase Auth 에러 메시지 처리
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        message: '이미 사용 중인 이메일입니다.',
      };
    } else if (error.code === 'auth/weak-password') {
      return {
        success: false,
        message: '비밀번호가 너무 약합니다. 최소 6자 이상 입력해주세요.',
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        message: '유효하지 않은 이메일 형식입니다.',
      };
    }

    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
}

/**
 * Firestore에서 사용자 정보 조회 또는 생성 (Google 로그인용)
 * Google 로그인의 경우 관리자는 즉시 승인, 학생은 승인 대기
 */
async function getOrCreateUser(firebaseUser: FirebaseUser, authMethod: 'google' | 'email' = 'google'): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as User;

    // 승인 상태 확인 (admin은 항상 승인)
    if (userData.role !== 'admin' && userData.registrationStatus !== 'approved') {
      // 로그아웃 처리
      await firebaseSignOut(auth);

      if (userData.registrationStatus === 'pending') {
        throw new Error('registration-pending');
      } else if (userData.registrationStatus === 'rejected') {
        throw new Error('registration-rejected');
      }
    }

    // 기존 사용자 - 마지막 로그인 시간 업데이트
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
    return userData;
  } else {
    // 새 사용자 생성 (Google 로그인의 경우, moonkyungfill@gmail.com은 선생님)
    const userRole: UserRole = firebaseUser.email === 'moonkyungfill@gmail.com' ? 'admin' : 'student';
    const registrationStatus: RegistrationStatus = userRole === 'admin' ? 'approved' : 'pending';

    const user = await createUserDocument(firebaseUser, firebaseUser.displayName || '사용자', userRole, firebaseUser.photoURL || undefined, registrationStatus);

    // 학생은 승인 전까지 로그인 불가
    if (userRole === 'student') {
      await firebaseSignOut(auth);
      throw new Error('registration-pending');
    }

    return user;
  }
}

/**
 * Firestore에 사용자 문서 생성
 */
async function createUserDocument(
  firebaseUser: FirebaseUser,
  displayName: string,
  role: UserRole,
  photoURL?: string,
  registrationStatus: RegistrationStatus = 'pending'
): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);

  const isApproved = registrationStatus === 'approved';
  const newUser: Record<string, any> = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: displayName,
    role: role,
    createdAt: serverTimestamp(),
    lastLoginAt: isApproved ? serverTimestamp() : null,
    isActive: isApproved, // 승인된 경우에만 활성화
    registrationStatus: registrationStatus,
  };

  // photoURL이 있을 때만 추가
  if (photoURL) {
    newUser.photoURL = photoURL;
  }

  await setDoc(userRef, newUser);
  return newUser as unknown as User;
}

/**
 * 사용자 역할 조회
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().role as UserRole;
    }
    return null;
  } catch (error) {
    console.error('역할 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자 정보 조회
 */
export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return null;
  }
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * 현재 사용자 가져오기
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * 프로필 완성도 확인
 * 학생: school, grade, class 모두 필수
 * 관리자: true 반환
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return false;
    }

    const user = userSnap.data() as User;

    // 관리자는 프로필 완성도 체크 없음
    if (user.role === 'admin') {
      return true;
    }

    // 학생: school, grade, class 모두 필수
    return !!(user.school && user.grade !== undefined && user.grade !== null && user.class);
  } catch (error) {
    console.error('프로필 완성도 확인 오류:', error);
    return false;
  }
}
