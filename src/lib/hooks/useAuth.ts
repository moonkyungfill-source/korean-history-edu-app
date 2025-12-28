'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogle,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getUserData,
} from '@/lib/firebase/auth';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          setState({
            user: userData,
            firebaseUser,
            loading: false,
            error: null,
          });
        } catch (error) {
          setState({
            user: null,
            firebaseUser,
            loading: false,
            error: '사용자 정보를 불러오는데 실패했습니다.',
          });
        }
      } else {
        setState({
          user: null,
          firebaseUser: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const user = await signInWithGoogle();
      // onAuthStateChange가 상태를 업데이트함
      return user;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: '로그인에 실패했습니다.',
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await firebaseSignOut();
      // onAuthStateChange가 상태를 업데이트함
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: '로그아웃에 실패했습니다.',
      }));
      throw error;
    }
  }, []);

  return {
    user: state.user,
    firebaseUser: state.firebaseUser,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === 'admin',
    isStudent: state.user?.role === 'student',
  };
}
