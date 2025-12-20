import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useWallet } from '../contexts';
import { Item } from '../types';
import { messagesApi, Message } from '../api/endpoints/messages';
import { itemsApi } from '../api/endpoints/items';
import { getUserProfile } from '../api/firestore/userProfile';
import { FirestoreUserProfile } from '../types';
import { getFullImageUrl } from '../utils/imageUrl';
import './DMPage.css';

export const DMPage = () => {
  const { recipientUid } = useParams<{ recipientUid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { jpyToEthDisplay } = useWallet();
  const item = location.state?.item as Item | undefined;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState<FirestoreUserProfile | null>(null);
  const [recipientItems, setRecipientItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // メッセージ一覧を取得
  const fetchMessages = useCallback(async () => {
    if (!user || !recipientUid) return;

    try {
      const data = await messagesApi.getMessages(user.uid, recipientUid);
      setMessages(data || []);

      // 相手からのメッセージを既読にする
      await messagesApi.markAsRead(user.uid, recipientUid);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, recipientUid]);

  // 相手のプロフィールを取得
  useEffect(() => {
    const fetchRecipientProfile = async () => {
      if (!recipientUid) return;
      try {
        const profile = await getUserProfile(recipientUid);
        setRecipientProfile(profile);
      } catch (err) {
        console.error('Failed to fetch recipient profile:', err);
      }
    };

    fetchRecipientProfile();
  }, [recipientUid]);

  // 相手の出品商品を取得
  useEffect(() => {
    const fetchRecipientItems = async () => {
      if (!recipientUid) return;
      setIsLoadingItems(true);
      try {
        const items = await itemsApi.getByUid(recipientUid);
        setRecipientItems(items || []);
      } catch (err) {
        console.error('Failed to fetch recipient items:', err);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchRecipientItems();
  }, [recipientUid]);

  // 初回読み込み＆ポーリング
  useEffect(() => {
    fetchMessages();

    // 5秒ごとに新しいメッセージをチェック
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !recipientUid || isSending) return;

    setIsSending(true);
    try {
      await messagesApi.sendMessage(
        user.uid,
        recipientUid,
        inputText.trim()
      );
      setInputText('');
      // 送信後に最新のメッセージを取得
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('メッセージの送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayName = recipientProfile?.nickname || `${recipientUid?.slice(0, 8)}...`;

  return (
    <div className="dm-page">
      <div className="dm-main-container">
        <div className="dm-chat-area">
          <header className="dm-header">
            <button onClick={() => navigate(-1)} className="back-button">
              ← 戻る
            </button>
            <div className="dm-header-info">
              {recipientProfile?.profileImageUrl ? (
                <img
                  src={recipientProfile.profileImageUrl}
                  alt={displayName}
                  className="dm-header-avatar"
                />
              ) : (
                <div className="dm-header-avatar-placeholder">
                  {displayName.charAt(0)}
                </div>
              )}
              <span className="recipient-name">{displayName}</span>
            </div>
          </header>

          {item && (
            <div className="dm-item-info">
              <div className="dm-item-content">
                {item.image_urls && item.image_urls.length > 0 && (
                  <img
                    src={getFullImageUrl(item.image_urls[0])}
                    alt={item.title}
                    className="dm-item-image"
                  />
                )}
                <div className="dm-item-details">
                  <p className="dm-item-title">{item.title}</p>
                  <p className="dm-item-price">{jpyToEthDisplay(item.price)} ETH</p>
                </div>
              </div>
            </div>
          )}

          <main className="dm-messages">
            {isLoading ? (
              <p className="dm-loading">読み込み中...</p>
            ) : messages.length === 0 ? (
              <p className="dm-empty">メッセージを送信してやり取りを開始しましょう</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`dm-message ${message.sender_uid === user?.uid ? 'sent' : 'received'}`}
                >
                  <p className="message-text">{message.content}</p>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(message.created_at)}</span>
                    {message.sender_uid === user?.uid && (
                      <span className={`message-status ${message.is_read ? 'read' : ''}`}>
                        {message.is_read ? '既読' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer className="dm-footer">
            <div className="dm-input-container">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                className="dm-input"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isSending}
                className="dm-send-button"
              >
                {isSending ? '...' : '送信'}
              </button>
            </div>
          </footer>
        </div>

        {/* 右サイドバー: 相手の出品商品 */}
        <aside className="dm-sidebar">
          <h3>{displayName}の出品</h3>
          {isLoadingItems ? (
            <p className="dm-sidebar-loading">読み込み中...</p>
          ) : recipientItems.length > 0 ? (
            <div className="dm-sidebar-items">
              {recipientItems.map((sidebarItem) => (
                <div
                  key={sidebarItem.id}
                  className="dm-sidebar-item-card"
                  onClick={() => navigate(`/item/${sidebarItem.id}`)}
                >
                  <div className="dm-sidebar-item-image">
                    {sidebarItem.image_urls && sidebarItem.image_urls.length > 0 ? (
                      <img src={getFullImageUrl(sidebarItem.image_urls[0])} alt={sidebarItem.title} />
                    ) : (
                      <div className="dm-sidebar-item-placeholder">No Image</div>
                    )}
                    {sidebarItem.ifPurchased && <span className="dm-sidebar-sold-tag">売切</span>}
                  </div>
                  <div className="dm-sidebar-item-info">
                    <p className="dm-sidebar-item-title">{sidebarItem.title}</p>
                    <p className="dm-sidebar-item-price">{jpyToEthDisplay(sidebarItem.price)} ETH</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="dm-sidebar-empty">出品商品はありません</p>
          )}
        </aside>
      </div>
    </div>
  );
};
