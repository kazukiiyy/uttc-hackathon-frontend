import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fireAuth, firestore } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  checkProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const checkProfile = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const hasProfile = userDoc.exists() && userDoc.data()?.nickname != null;
      setIsProfileComplete(hasProfile);
      return hasProfile;
    } catch (error) {
      console.error('プロフィールチェックエラー:', error);
      return false;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(fireAuth);
    setUser(null);
    setIsProfileComplete(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          setIsProfileComplete(userDoc.exists() && userDoc.data()?.nickname != null);
        } catch (error) {
          console.error('プロフィールチェックエラー:', error);
          setIsProfileComplete(false);
        }
      } else {
        setIsProfileComplete(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isProfileComplete, signOut, checkProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
