import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsApi } from '../api/endpoints/items';
import { Item, FirestoreUserProfile } from '../types';
import { useAuth } from '../contexts';
import { getUserProfile } from '../api/firestore/userProfile';
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

  const handleDMClick = () => {
    if (item) {
      navigate(`/dm/${item.uid}`, { state: { item } });
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
                src={item.image_urls[currentImageIndex]}
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
          <p className="detail-price">¥{item.price.toLocaleString()}</p>

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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
