import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { UserProgress } from '../utils/kannada';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncProgressToFirestore: (progress: UserProgress, nativeLang: string) => Promise<void>;
  loadProgressFromFirestore: () => Promise<UserProgress | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  syncProgressToFirestore: async () => {},
  loadProgressFromFirestore: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile to Firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            {
              userId: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Learner',
              photoURL: currentUser.photoURL || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not update user profile in Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-Out failed:', error);
      throw error;
    }
  };

  const syncProgressToFirestore = async (progress: UserProgress, nativeLang: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/progress/current`;
    try {
      const progressRef = doc(db, 'users', auth.currentUser.uid, 'progress', 'current');
      await setDoc(
        progressRef,
        {
          userId: auth.currentUser.uid,
          learnedPhraseIds: progress.learnedPhraseIds,
          completedScenarios: progress.completedScenarios,
          quizScores: progress.quizScores,
          roleplayCompleted: progress.roleplayCompleted,
          badges: progress.badges,
          nativeLanguage: nativeLang,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const loadProgressFromFirestore = async (): Promise<UserProgress | null> => {
    if (!auth.currentUser) return null;
    const path = `users/${auth.currentUser.uid}/progress/current`;
    try {
      const progressRef = doc(db, 'users', auth.currentUser.uid, 'progress', 'current');
      const snap = await getDoc(progressRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          learnedPhraseIds: data.learnedPhraseIds || [],
          completedScenarios: data.completedScenarios || [],
          quizScores: data.quizScores || {},
          roleplayCompleted: data.roleplayCompleted || [],
          badges: data.badges || [],
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        syncProgressToFirestore,
        loadProgressFromFirestore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
