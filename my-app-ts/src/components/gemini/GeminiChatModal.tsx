import { useState, useRef, useEffect } from 'react';
import { geminiApi } from '../../api/endpoints/gemini';
import './GeminiChatModal.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiChatModal = ({ isOpen, onClose }: GeminiChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await geminiApi.generate({
        prompt: userMessage,
        protocol: '',
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error: any) {
      console.error('Gemini API error:', error);
      let errorMessage = '申し訳ございません。エラーが発生しました。もう一度お試しください。';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gemini-modal-overlay" onClick={onClose}>
      <div className="gemini-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="gemini-modal-header">
          <h2>💬 ethershop ヘルプ</h2>
          <button className="gemini-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="gemini-modal-messages">
          {messages.length === 0 && (
            <div className="gemini-welcome-message">
              <p>こんにちは！ethershopのチャットbotです。</p>
              <p>アプリの使い方やWeb3について、何でもお聞きください！</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`gemini-message gemini-message-${message.role}`}
            >
              <div className="gemini-message-content">{message.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="gemini-message gemini-message-assistant">
              <div className="gemini-message-content">
                <span className="gemini-loading">考え中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="gemini-modal-input">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}>
            送信
          </button>
        </div>
      </div>
    </div>
  );
};

