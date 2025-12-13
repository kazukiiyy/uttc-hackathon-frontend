import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts';
import { Item } from '../types';
import './DMPage.css';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export const DMPage = () => {
  const { recipientUid } = useParams<{ recipientUid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const item = location.state?.item as Item | undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim() || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.uid,
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // TODO: バックエンドにメッセージを送信する処理を追加
    console.log('Message sent:', {
      from: user.uid,
      to: recipientUid,
      text: newMessage.text,
      itemId: item?.id,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dm-page">
      <header className="dm-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← 戻る
        </button>
        <div className="dm-header-info">
          <span className="recipient-uid">{recipientUid?.slice(0, 8)}...</span>
        </div>
      </header>

      {item && (
        <div className="dm-item-info">
          <div className="dm-item-content">
            {item.image_urls && item.image_urls.length > 0 && (
              <img src={item.image_urls[0]} alt={item.title} className="dm-item-image" />
            )}
            <div className="dm-item-details">
              <p className="dm-item-title">{item.title}</p>
              <p className="dm-item-price">¥{item.price.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <main className="dm-messages">
        {messages.length === 0 ? (
          <p className="dm-empty">メッセージを送信してやり取りを開始しましょう</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`dm-message ${message.senderId === user?.uid ? 'sent' : 'received'}`}
            >
              <p className="message-text">{message.text}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
      </main>

      <footer className="dm-footer">
        <div className="dm-input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="dm-input"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="dm-send-button"
          >
            送信
          </button>
        </div>
      </footer>
    </div>
  );
};
