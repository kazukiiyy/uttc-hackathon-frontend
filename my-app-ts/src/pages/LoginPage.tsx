import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fireAuth, firestore } from '../firebase';
import { useAuth } from '../contexts';
import './LoginPage.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const checkUserProfile = async (uid: string): Promise<boolean> => {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists() && userDoc.data()?.nickname != null;
    } catch (error) {
      console.error('プロフィールチェックエラー:', error);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const res = await signInWithPopup(fireAuth, provider);
      const user = res.user;
      const isRegistered = await checkUserProfile(user.uid);

      if (isRegistered) {
        alert('ログインユーザー: ' + user.displayName);
        navigate('/');
      } else {
        alert('新規登録が必要です。プロフィールを入力してください。');
        navigate('/register');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      alert(errorMessage);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      alert('ログアウトしました');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">ログイン</h1>
      <button className="google-btn" onClick={signInWithGoogle}>
        Googleでログイン
      </button>
      <button className="logout-btn" onClick={handleSignOut}>
        ログアウト
      </button>
    </div>
  );
};
