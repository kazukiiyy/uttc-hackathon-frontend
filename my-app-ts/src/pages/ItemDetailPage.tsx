import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsApi } from '../api/endpoints/items';
import { likesApi } from '../api/endpoints/likes';
import { Item, FirestoreUserProfile } from '../types';
import { useAuth } from '../contexts';
import { getUserProfile } from '../api/firestore/userProfile';
import { getFullImageUrl } from '../utils/imageUrl';
import './ItemDetailPage.css';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [sellerProfile, setSellerProfile] = useState<FirestoreUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await itemsApi.getById(id);
        setItem(data);

        // 出品者のプロフィールを取得
        if (data.uid) {
          const profile = await getUserProfile(data.uid);
          setSellerProfile(profile);
        }
      } catch (err) {
        setError('商品の取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // itemから初期like_countを設定し、いいね状態を取得
  useEffect(() => {
    if (item) {
      setLikeCount(item.like_count);
    }
  }, [item]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!id || !user) return;

      try {
        const status = await likesApi.getLikeStatus(parseInt(id), user.uid);
        setIsLiked(status.liked);
      } catch (err) {
        console.error('Failed to fetch like status:', err);
      }
    };

    fetchLikeStatus();
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!item || !user || isLikeLoading) return;

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await likesApi.removeLike(item.id, user.uid);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await likesApi.addLike(item.id, user.uid);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDMClick = () => {
    if (item) {
      navigate(`/dm/${item.uid}`, { state: { item } });
    }
  };

  const handlePurchase = async () => {
    if (!item || !user) return;

    if (!window.confirm(`「${item.title}」を¥${item.price.toLocaleString()}で購入しますか？`)) {
      return;
    }

    setIsPurchasing(true);
    try {
      await itemsApi.purchase(item.id, user.uid);
      setItem({ ...item, ifPurchased: true });
      alert('購入が完了しました！');
    } catch (err) {
      console.error(err);
      alert('購入に失敗しました。');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="item-detail-page">
        <p className="loading-text">読み込み中...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-detail-page">
        <p className="error-text">{error || '商品が見つかりません'}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          戻る
        </button>
      </div>
    );
  }

  const isOwnItem = user?.uid === item.uid;

  const handlePrevImage = () => {
    if (item?.image_urls) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? item.image_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (item?.image_urls) {
      setCurrentImageIndex((prev) =>
        prev === item.image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <div className="item-detail-page">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← 戻る
        </button>
      </header>

      <main className="detail-main">
        {item.ifPurchased && (
          <div className="sold-banner">この商品は売り切れです</div>
        )}

        <div className="image-carousel">
          {item.image_urls && item.image_urls.length > 0 ? (
            <>
              <img
                src={getFullImageUrl(item.image_urls[currentImageIndex])}
                alt={`${item.title} - 画像${currentImageIndex + 1}`}
                className="detail-image"
              />
              {item.image_urls.length > 1 && (
                <>
                  <button className="carousel-btn prev" onClick={handlePrevImage}>
                    ‹
                  </button>
                  <button className="carousel-btn next" onClick={handleNextImage}>
                    ›
                  </button>
                  <div className="image-indicators">
                    {item.image_urls.map((_, index) => (
                      <span
                        key={index}
                        className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="detail-image-placeholder">画像がありません</div>
          )}
        </div>

        <div className="detail-content">
          <h1 className="detail-title">{item.title}</h1>
          <div className="price-like-row">
            <p className="detail-price">¥{item.price.toLocaleString()}</p>
            <button
              className={`like-button ${isLiked ? 'liked' : ''}`}
              onClick={handleLikeToggle}
              disabled={!user || isLikeLoading}
            >
              <span className="like-icon">{isLiked ? '♥' : '♡'}</span>
              <span className="like-count">{likeCount}</span>
            </button>
          </div>

          <div className="detail-meta">
            <span className="meta-item">
              <span className="meta-label">出品日</span>
              <span className="meta-value">{formatDate(item.created_at)}</span>
            </span>
            <span className="meta-item">
              <span className="meta-label">状態</span>
              <span className={`meta-value status ${item.ifPurchased ? 'sold' : 'available'}`}>
                {item.ifPurchased ? '売り切れ' : '販売中'}
              </span>
            </span>
          </div>

          <div className="detail-section">
            <h3>商品説明</h3>
            <p className="detail-explanation">{item.explanation}</p>
          </div>

          <div className="detail-section">
            <h3>カテゴリ</h3>
            <p className="detail-category">{item.category}</p>
          </div>

          <div className="detail-section seller-section">
            <h3>出品者</h3>
            <div className="seller-info">
              {sellerProfile?.profileImageUrl ? (
                <img
                  src={sellerProfile.profileImageUrl}
                  alt={sellerProfile.nickname}
                  className="seller-avatar"
                />
              ) : (
                <div className="seller-avatar-placeholder" />
              )}
              <span className="seller-name">
                {sellerProfile?.nickname || `${item.uid.slice(0, 8)}...`}
              </span>
              {!isOwnItem && !item.ifPurchased && (
                <button onClick={handleDMClick} className="dm-button">
                  DMを送る
                </button>
              )}
              {isOwnItem && (
                <button onClick={() => navigate('/mypage')} className="dm-button">
                  DMを確認
                </button>
              )}
            </div>
          </div>

          {!isOwnItem && !item.ifPurchased && (
            <div className="purchase-section">
              <button
                onClick={handlePurchase}
                className="purchase-button"
                disabled={isPurchasing}
              >
                {isPurchasing ? '処理中...' : `¥${item.price.toLocaleString()}で購入する`}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
