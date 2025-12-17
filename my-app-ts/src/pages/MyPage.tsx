import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useWallet } from '../contexts';
import { getUserProfile } from '../api/firestore/userProfile';
import { messagesApi, Conversation } from '../api/endpoints/messages';
import { itemsApi, PurchasedItem } from '../api/endpoints/items';
import { likesApi } from '../api/endpoints/likes';
import { FirestoreUserProfile, Item } from '../types';
import { getFullImageUrl } from '../utils/imageUrl';
import { Button } from '../components/ui';
import './MyPage.css';

// 会話相手のプロフィール情報を含む型
interface ConversationWithProfile extends Conversation {
  partnerProfile?: FirestoreUserProfile | null;
}

export const MyPage = () => {
  const { user, signOut } = useAuth();
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
  } = useWallet();
  const [showNetworkSelect, setShowNetworkSelect] = useState(false);
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [listedItems, setListedItems] = useState<Item[]>([]);
  const [isLoadingListed, setIsLoadingListed] = useState(true);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [isLoadingPurchased, setIsLoadingPurchased] = useState(true);
  const [likedItems, setLikedItems] = useState<Item[]>([]);
  const [isLoadingLiked, setIsLoadingLiked] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const data = await getUserProfile(user.uid);
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [user]);

  // 会話一覧を取得
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        const data = await messagesApi.getConversations(user.uid);

        // 各会話相手のプロフィールを取得
        const conversationsWithProfiles = await Promise.all(
          (data || []).map(async (conv) => {
            try {
              const partnerProfile = await getUserProfile(conv.partner_uid);
              return { ...conv, partnerProfile };
            } catch {
              return { ...conv, partnerProfile: null };
            }
          })
        );

        setConversations(conversationsWithProfiles);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [user]);

  // 出品した商品を取得
  useEffect(() => {
    const fetchListedItems = async () => {
      if (!user) return;

      try {
        const data = await itemsApi.getByUid(user.uid);
        setListedItems(data || []);
      } catch (err) {
        console.error('Failed to fetch listed items:', err);
      } finally {
        setIsLoadingListed(false);
      }
    };

    fetchListedItems();
  }, [user]);

  // 購入した商品を取得
  useEffect(() => {
    const fetchPurchasedItems = async () => {
      if (!user) return;

      try {
        const data = await itemsApi.getPurchasedItems(user.uid);
        setPurchasedItems(data || []);
      } catch (err) {
        console.error('Failed to fetch purchased items:', err);
      } finally {
        setIsLoadingPurchased(false);
      }
    };

    fetchPurchasedItems();
  }, [user]);

  // いいねした商品を取得
  useEffect(() => {
    const fetchLikedItems = async () => {
      if (!user) return;

      try {
        const { item_ids } = await likesApi.getUserLikes(user.uid);
        if (item_ids && item_ids.length > 0) {
          const items = await itemsApi.getByIds(item_ids);
          setLikedItems(items);
        }
      } catch (err) {
        console.error('Failed to fetch liked items:', err);
      } finally {
        setIsLoadingLiked(false);
      }
    };

    fetchLikedItems();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    }
  };

  const handleConversationClick = (partnerUid: string) => {
    navigate(`/dm/${partnerUid}`);
  };

  const handleItemClick = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const displayName = profile?.nickname || user?.displayName || 'ゲスト';
  const displayImage = profile?.profileImageUrl || user?.photoURL;


  return (
    <div className="my-page">
      <header className="my-page-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {displayImage ? (
              <img src={displayImage} alt="プロフィール" />
            ) : (
              <div className="avatar-placeholder">
                {displayName.charAt(0) || '?'}
              </div>
            )}
          </div>
          {isConnected && (
            <div className="wallet-badge connected" title={address || ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
          )}
        </div>
        <h2>{displayName}</h2>
        <p>{user?.email}</p>
        {isConnected && (
          <div className="header-wallet-info">
            <span className="header-wallet-address">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
        )}
        {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
      </header>

      <main className="my-page-main">
        <section className="my-page-section">
          <h3>メッセージ</h3>
          {isLoadingConversations ? (
            <p className="placeholder-text">読み込み中...</p>
          ) : conversations.length === 0 ? (
            <p className="placeholder-text">メッセージはありません</p>
          ) : (
            <div className="conversation-list">
              {conversations.map((conv) => {
                const partnerName = conv.partnerProfile?.nickname || `${conv.partner_uid.slice(0, 8)}...`;
                const partnerImage = conv.partnerProfile?.profileImageUrl;

                return (
                  <div
                    key={conv.partner_uid}
                    className="conversation-item"
                    onClick={() => handleConversationClick(conv.partner_uid)}
                  >
                    <div className="conversation-avatar">
                      {partnerImage ? (
                        <img src={partnerImage} alt={partnerName} />
                      ) : (
                        <div className="conversation-avatar-placeholder">
                          {partnerName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <span className="conversation-name">{partnerName}</span>
                        <span className="conversation-time">{formatTime(conv.last_message_at)}</span>
                      </div>
                      <div className="conversation-preview">
                        <p className="conversation-message">{conv.last_message}</p>
                        {conv.unread_count > 0 && (
                          <span className="unread-badge">{conv.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="my-page-section">
          <h3>出品した商品</h3>
          {isLoadingListed ? (
            <p className="placeholder-text">読み込み中...</p>
          ) : listedItems.length === 0 ? (
            <p className="placeholder-text">出品した商品がありません</p>
          ) : (
            <div className="items-grid-horizontal">
              {listedItems.map((item) => (
                <div
                  key={item.id}
                  className="item-card-small"
                  onClick={() => handleItemClick(item.id)}
                >
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <img
                      src={getFullImageUrl(item.image_urls[0])}
                      alt={item.title}
                      className="item-card-image"
                    />
                  ) : (
                    <div className="item-card-image-placeholder">No Image</div>
                  )}
                  <div className="item-card-info">
                    <p className="item-card-title">{item.title}</p>
                    <p className="item-card-price">¥{item.price.toLocaleString()}</p>
                    {item.ifPurchased && <span className="sold-badge-small">売切</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="my-page-section">
          <h3>購入した商品</h3>
          {isLoadingPurchased ? (
            <p className="placeholder-text">読み込み中...</p>
          ) : purchasedItems.length === 0 ? (
            <p className="placeholder-text">購入した商品がありません</p>
          ) : (
            <div className="items-grid-horizontal">
              {purchasedItems.map((item) => (
                <div
                  key={item.id}
                  className="item-card-small"
                  onClick={() => handleItemClick(item.id)}
                >
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <img
                      src={getFullImageUrl(item.image_urls[0])}
                      alt={item.title}
                      className="item-card-image"
                    />
                  ) : (
                    <div className="item-card-image-placeholder">No Image</div>
                  )}
                  <div className="item-card-info">
                    <p className="item-card-title">{item.title}</p>
                    <p className="item-card-price">¥{item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="my-page-section">
          <h3>♥ いいねした商品</h3>
          {isLoadingLiked ? (
            <p className="placeholder-text">読み込み中...</p>
          ) : likedItems.length === 0 ? (
            <p className="placeholder-text">いいねした商品がありません</p>
          ) : (
            <div className="items-grid-horizontal">
              {likedItems.map((item) => (
                <div
                  key={item.id}
                  className="item-card-small"
                  onClick={() => handleItemClick(item.id)}
                >
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <img
                      src={getFullImageUrl(item.image_urls[0])}
                      alt={item.title}
                      className="item-card-image"
                    />
                  ) : (
                    <div className="item-card-image-placeholder">No Image</div>
                  )}
                  <div className="item-card-info">
                    <p className="item-card-title">{item.title}</p>
                    <p className="item-card-price">¥{item.price.toLocaleString()}</p>
                    {item.ifPurchased && <span className="sold-badge-small">売切</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="my-page-section">
          <h3>ウォレット</h3>
          <div className="wallet-section">
            {!isConnected ? (
              <div className="wallet-connect">
                <p className="wallet-description">
                  MetaMaskウォレットを接続して、暗号通貨での取引を有効にしましょう
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={connect}
                  disabled={isConnecting}
                >
                  {isConnecting ? '接続中...' : 'ウォレットを接続'}
                </Button>
              </div>
            ) : (
              <div className="wallet-card">
                <div className="wallet-card-header">
                  <div className="wallet-card-balance">
                    <span className="balance-value">
                      {balance ? parseFloat(balance).toFixed(4) : '0.0000'}
                    </span>
                    <span className="balance-symbol">{networkSymbol || 'ETH'}</span>
                  </div>
                  <button className="disconnect-btn" onClick={disconnect}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                  </button>
                </div>
                <div className="wallet-card-address">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <div
                  className="wallet-card-network"
                  onClick={() => setShowNetworkSelect(!showNetworkSelect)}
                >
                  <span className="network-dot"></span>
                  <span>{networkName || 'Unknown'}</span>
                  <span className="dropdown-arrow">{showNetworkSelect ? '▲' : '▼'}</span>
                </div>

                {showNetworkSelect && (
                  <div className="network-select">
                    <button
                      className="network-option"
                      onClick={() => { switchNetwork('ethereum'); setShowNetworkSelect(false); }}
                    >
                      Ethereum Mainnet
                    </button>
                    <button
                      className="network-option"
                      onClick={() => { switchNetwork('sepolia'); setShowNetworkSelect(false); }}
                    >
                      Sepolia Testnet
                    </button>
                    <button
                      className="network-option"
                      onClick={() => { switchNetwork('polygon'); setShowNetworkSelect(false); }}
                    >
                      Polygon Mainnet
                    </button>
                    <button
                      className="network-option"
                      onClick={() => { switchNetwork('mumbai'); setShowNetworkSelect(false); }}
                    >
                      Polygon Mumbai
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="my-page-section">
          <h3>アカウント設定</h3>
          <div className="settings-list">
            <button className="settings-item" onClick={() => navigate('/profile/edit')}>
              プロフィール編集
            </button>
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
