import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { itemsApi } from '../api/endpoints/items';
import { Item } from '../types';
import { getFullImageUrl } from '../utils/imageUrl';
import './HomePage.css';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestItems, setLatestItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        const data = await itemsApi.getLatest(10);
        setLatestItems(data || []);
      } catch (err) {
        console.error('Failed to fetch latest items:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestItems();
  }, []);

  const handleItemClick = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>フリマアプリ</h1>
      </header>

      <main className="home-main">
        <div className="welcome-section">
          <h2>ようこそ、{user?.displayName || 'ゲスト'}さん</h2>
          <p>商品を探したり、出品したりしてみましょう。</p>
        </div>

        <section className="home-section">
          <h3>新着商品</h3>
          {isLoading ? (
            <p className="placeholder-text">読み込み中...</p>
          ) : latestItems.length === 0 ? (
            <p className="placeholder-text">商品がありません</p>
          ) : (
            <div className="items-grid">
              {latestItems.map((item) => (
                <div
                  key={item.id}
                  className="item-card"
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
                    {item.ifPurchased && <span className="sold-badge">売切</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
