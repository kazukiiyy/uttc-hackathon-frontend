import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { GeminiChatModal } from '../gemini/GeminiChatModal';
import './Header.css';

export const Header = () => {
  const navigate = useNavigate();
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    networkName,
    networkSymbol,
    connect,
    disconnect,
    switchNetwork,
    isSepoliaNetwork,
  } = useWallet();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const walletInfoRef = useRef<HTMLDivElement>(null);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNetworkMenu]);

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

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-logo" onClick={() => navigate('/')}>
            ethershop
          </h1>
        </div>

        <div className="header-right">
          <button
            className="help-button"
            onClick={() => setShowGeminiModal(true)}
            title="ヘルプ"
          >
            ?
          </button>
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

