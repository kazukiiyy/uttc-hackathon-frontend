import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { itemsApi } from '../api/endpoints/items';
import { likesApi } from '../api/endpoints/likes';
import { Item } from '../types';
import { getFullImageUrl } from '../utils/imageUrl';
import './HomePage.css';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestItems, setLatestItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        const data = await itemsApi.getLatest(10);
        setLatestItems(data || []);
        // 初期like_countを設定
        const counts: Record<number, number> = {};
        (data || []).forEach(item => {
          counts[item.id] = item.like_count;
        });
        setLikeCounts(counts);
      } catch (err) {
        console.error('Failed to fetch latest items:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestItems();
  }, []);

  // ユーザーのいいね状態を取得
  useEffect(() => {
    const fetchUserLikes = async () => {
      if (!user) return;
      try {
        const response = await likesApi.getUserLikes(user.uid);
        setLikedItems(new Set(response.item_ids || []));
      } catch (err) {
        console.error('Failed to fetch user likes:', err);
      }
    };
    fetchUserLikes();
  }, [user]);

  const handleItemClick = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

  const handleLikeToggle = async (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    if (!user || likeLoadingIds.has(itemId)) return;

    setLikeLoadingIds(prev => new Set(prev).add(itemId));
    try {
      if (likedItems.has(itemId)) {
        await likesApi.removeLike(itemId, user.uid);
        setLikedItems(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        setLikeCounts(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) - 1) }));
      } else {
        await likesApi.addLike(itemId, user.uid);
        setLikedItems(prev => new Set(prev).add(itemId));
        setLikeCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLikeLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
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
                    <div className="item-card-bottom">
                      <p className="item-card-price">¥{item.price.toLocaleString()}</p>
                      <button
                        className={`item-like-btn ${likedItems.has(item.id) ? 'liked' : ''}`}
                        onClick={(e) => handleLikeToggle(e, item.id)}
                        disabled={!user || likeLoadingIds.has(item.id)}
                      >
                        <span className="item-like-icon">{likedItems.has(item.id) ? '♥' : '♡'}</span>
                        <span className="item-like-count">{likeCounts[item.id] || 0}</span>
                      </button>
                    </div>
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
