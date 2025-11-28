import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css'; // 後述のCSS

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 現在のパスがアクティブかどうか判定する関数
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${isActive('/') ? 'active' : ''}`} 
        onClick={() => navigate('/')}
      >
        🏠<br/>ホーム
      </button>

      <button 
        className={`nav-item ${isActive('/search') ? 'active' : ''}`} 
        onClick={() => navigate('/search')}
      >
        🔍<br/>検索
      </button>

      {/* 出品ボタン（目立たせることが多いです） */}
      <button 
        className={`nav-item sell-button ${isActive('/sell') ? 'active' : ''}`} 
        onClick={() => navigate('/sell')}
      >
        📷<br/>出品
      </button>

      <button 
        className={`nav-item ${isActive('/mypage') ? 'active' : ''}`} 
        onClick={() => navigate('/mypage')}
      >
        👤<br/>設定
      </button>
    </nav>
  );
};