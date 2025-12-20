import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { GeminiChatModal } from '../gemini/GeminiChatModal';
import { messagesApi } from '../../api/endpoints/messages';
import './Header.css';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    networkSymbol,
    connect,
    disconnect,
    switchNetwork,
    isSepoliaNetwork,
  } = useWallet();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const walletInfoRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 未読メッセージ数を取得
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const conversations = await messagesApi.getConversations(user.uid);
      const total = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('未読数の取得に失敗:', error);
    }
  }, [user]);

  // 未読数を定期的に更新
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // メニュー外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNetworkMenu &&
        menuRef.current &&
        walletInfoRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !walletInfoRef.current.contains(event.target as Node)
      ) {
        setShowNetworkMenu(false);
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNetworkMenu, showUserMenu]);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setShowNetworkMenu(false);
  };

  const handleNetworkSwitch = async (network: 'sepolia' | 'ethereum' | 'polygon' | 'mumbai') => {
    await switchNetwork(network);
    setShowNetworkMenu(false);
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-logo" onClick={() => navigate('/')}>
            ethershop
          </h1>
        </div>

        <div className="header-right">
          {/* DM通知アイコン */}
          {user && (
            <button
              className="dm-notification-btn"
              onClick={() => navigate('/mypage')}
              title="メッセージ"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="dm-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          )}

          <button
            className="help-button"
            onClick={() => setShowGeminiModal(true)}
            title="ヘルプ"
          >
            ?
          </button>

          {/* ユーザーメニュー */}
          {user && (
            <div className="user-menu-container" ref={userMenuRef}>
              <button
                className="user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="アカウント"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <button
                    className="user-dropdown-item"
                    onClick={() => {
                      navigate('/mypage');
                      setShowUserMenu(false);
                    }}
                  >
                    マイページ
                  </button>
                  <button
                    className="user-dropdown-item"
                    onClick={() => {
                      navigate('/profile/edit');
                      setShowUserMenu(false);
                    }}
                  >
                    プロフィール編集
                  </button>
                  <div className="user-dropdown-divider"></div>
                  <button
                    className="user-dropdown-item logout"
                    onClick={handleLogout}
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          )}

          {!isConnected ? (
            <button
              className="wallet-connect-btn"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              <span className="wallet-icon">🔗</span>
              <span>{isConnecting ? '接続中...' : 'ウォレット連携'}</span>
            </button>
          ) : (
            <div className="wallet-info" ref={walletInfoRef}>
              <div className="wallet-balance">
                <span className="balance-amount">
                  {balance ? parseFloat(balance).toFixed(4) : '0.0000'}
                </span>
                <span className="balance-symbol">{networkSymbol || 'ETH'}</span>
              </div>
              <div className="wallet-address" onClick={() => setShowNetworkMenu(!showNetworkMenu)}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
                <span className="network-indicator">
                  {isSepoliaNetwork ? '🟢' : '🟡'}
                </span>
              </div>
              {showNetworkMenu && (
                <div className="wallet-menu" ref={menuRef}>
                  <div className="wallet-menu-section">
                    <div className="wallet-menu-label">ネットワーク</div>
                    <button
                      className={`wallet-menu-item ${isSepoliaNetwork ? 'active' : ''}`}
                      onClick={() => handleNetworkSwitch('sepolia')}
                    >
                      <span>Sepolia Testnet</span>
                      {isSepoliaNetwork && <span>✓</span>}
                    </button>
                    <button
                      className="wallet-menu-item"
                      onClick={() => handleNetworkSwitch('ethereum')}
                    >
                      Ethereum Mainnet
                    </button>
                    <button
                      className="wallet-menu-item"
                      onClick={() => handleNetworkSwitch('polygon')}
                    >
                      Polygon Mainnet
                    </button>
                    <button
                      className="wallet-menu-item"
                      onClick={() => handleNetworkSwitch('mumbai')}
                    >
                      Polygon Mumbai
                    </button>
                  </div>
                  <div className="wallet-menu-divider"></div>
                  <button className="wallet-menu-item disconnect" onClick={handleDisconnect}>
                    <span>🔌 切断</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <GeminiChatModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
      />
    </header>
  );
};

