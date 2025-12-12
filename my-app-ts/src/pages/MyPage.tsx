import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { Button } from '../components/ui';
import './MyPage.css';

export const MyPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    }
  };

  return (
    <div className="my-page">
      <header className="my-page-header">
        <div className="profile-avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="プロフィール" />
          ) : (
            <div className="avatar-placeholder">
              {user?.displayName?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <h2>{user?.displayName || 'ゲスト'}</h2>
        <p>{user?.email}</p>
      </header>

      <main className="my-page-main">
        <section className="my-page-section">
          <h3>出品した商品</h3>
          <p className="placeholder-text">出品した商品がありません</p>
        </section>

        <section className="my-page-section">
          <h3>購入した商品</h3>
          <p className="placeholder-text">購入した商品がありません</p>
        </section>

        <section className="my-page-section">
          <h3>アカウント設定</h3>
          <div className="settings-list">
            <button className="settings-item">プロフィール編集</button>
            <button className="settings-item">通知設定</button>
            <button className="settings-item">ヘルプ</button>
          </div>
        </section>

        <div className="logout-section">
          <Button variant="outline" fullWidth onClick={handleSignOut}>
            ログアウト
          </Button>
        </div>
      </main>
    </div>
  );
};
