import { useNavigate } from 'react-router-dom' ;
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { fireAuth } from "../../firebase";
import './GoogleLoginPage.css';

export const GoogleLoginPage: React.FC = () => {
  /**
   * googleでログインする
   */
  const navigate = useNavigate();
  const signInWithGoogle = (): void => {
    // Google認証プロバイダを利用する
    const provider = new GoogleAuthProvider();

    // ログイン用のポップアップを表示
    signInWithPopup(fireAuth, provider)
      .then(res => {
        const user = res.user;
        alert("ログインユーザー: " + user.displayName);
        navigate('/');
      })
      .catch(err => {
        const errorMessage = err.message;
        alert(errorMessage);
      });
  };

  /**
   * ログアウトする
   */
  const signOutWithGoogle = (): void => {
    signOut(fireAuth).then(() => {
      alert("ログアウトしました");
    }).catch(err => {
      alert(err);
    });
  };

  
  

  return (
    <div className="google-login-container">
      <h1 className="google-login-title">ログインページ</h1>
      <button className="google-btn" onClick={signInWithGoogle}>
        Googleでログイン
      </button>
      <button className="logout-btn" onClick={signOutWithGoogle}>
        ログアウト
      </button>
    </div>
  );
};