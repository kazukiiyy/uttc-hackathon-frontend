import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsApi } from '../api/endpoints/items';
import { likesApi } from '../api/endpoints/likes';
import { Item, FirestoreUserProfile } from '../types';
import { useAuth, useWallet } from '../contexts';
import { getUserProfile } from '../api/firestore/userProfile';
import { getFullImageUrl } from '../utils/imageUrl';
import { ShareButton } from '../components/ui';
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

type PurchaseStep = 'select' | 'processing' | 'confirming' | 'success' | 'error';

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    address,
    isConnected,
    isSepoliaNetwork,
    connect,
    switchNetwork,
    buyItem,
    jpyToWei,
    jpyToEthDisplay,
  } = useWallet();

  const [item, setItem] = useState<Item | null>(null);
  const [sellerProfile, setSellerProfile] = useState<FirestoreUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // 購入モーダル用
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('select');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

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

  // 購入ボタンクリック - モーダルを開く
  const handlePurchaseClick = () => {
    setShowPurchaseModal(true);
    setPurchaseStep('select');
    setPurchaseError(null);
    setTxHash(null);
  };

  // 現金で購入（既存のバックエンドAPI経由）
  const handleCashPurchase = async () => {
    if (!item || !user) return;

    setIsPurchasing(true);
    setPurchaseStep('processing');
    try {
      await itemsApi.purchase(item.id, user.uid);
      setItem({ ...item, ifPurchased: true });
      setPurchaseStep('success');
    } catch (err) {
      console.error(err);
      setPurchaseError('購入に失敗しました');
      setPurchaseStep('error');
    } finally {
      setIsPurchasing(false);
    }
  };

  // スマートコントラクト経由で購入
  const handleCryptoPurchase = async () => {
    if (!item || !user || !address) return;

    // chain_item_idが必要（スマートコントラクト上のID）
    // 既存のDBのidではなく、chain_item_idを使用
    const chainItemId = (item as any).chain_item_id;
    if (!chainItemId) {
      setPurchaseError('この商品はブロックチェーン上に登録されていません');
      setPurchaseStep('error');
      return;
    }

    setIsPurchasing(true);
    setPurchaseStep('processing');
    setPurchaseError(null);

    try {
      // スマートコントラクトのbuyItemを呼び出し
      const priceWei = jpyToWei(item.price);
      const hash = await buyItem({
        itemId: chainItemId,
        priceWei,
      });

      setTxHash(hash);
      setPurchaseStep('confirming');

      // トランザクション完了後、UIを更新
      setItem({ ...item, ifPurchased: true });
      setPurchaseStep('success');
    } catch (err: any) {
      console.error(err);
      setPurchaseError(err.message || '購入に失敗しました');
      setPurchaseStep('error');
    } finally {
      setIsPurchasing(false);
    }
  };

  // モーダルを閉じる
  const closePurchaseModal = () => {
    if (purchaseStep !== 'processing' && purchaseStep !== 'confirming') {
      setShowPurchaseModal(false);
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

  // ETH価格を表示用に計算
  const ethPrice = jpyToEthDisplay(item.price);

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
          <div className="price-card">
            <div className="price-card-row">
              <div className="price-info">
                <p className="detail-price">
                  <span className="price-currency">¥</span>
                  {item.price.toLocaleString()}
                </p>
                <p className="eth-price">≈ {ethPrice} ETH</p>
              </div>
              <div className="price-card-actions">
                <button
                  className={`like-button ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeToggle}
                  disabled={!user || isLikeLoading}
                >
                  <span className="like-icon">{isLiked ? '♥' : '♡'}</span>
                  <span className="like-count">{likeCount}</span>
                </button>
                <ShareButton
                  title={item.title}
                  text={`¥${item.price.toLocaleString()} - ${item.explanation.slice(0, 50)}...`}
                  url={window.location.href}
                  className="share-button-detail"
                />
              </div>
            </div>
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

          <div className="seller-card">
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
                onClick={handlePurchaseClick}
                className="purchase-button"
                disabled={isPurchasing}
              >
                {isPurchasing ? '処理中...' : `¥${item.price.toLocaleString()}で購入する`}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 購入方法選択モーダル */}
      {showPurchaseModal && (
        <div className="purchase-modal-overlay" onClick={closePurchaseModal}>
          <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
            {purchaseStep === 'select' && (
              <>
                <h2 className="modal-title">購入方法を選択</h2>
                <p className="modal-subtitle">「{item.title}」を購入します</p>

                <div className="payment-options">
                  <button className="payment-option cash" onClick={handleCashPurchase}>
                    <span className="payment-icon">💴</span>
                    <span className="payment-label">現金で購入</span>
                    <span className="payment-price">¥{item.price.toLocaleString()}</span>
                  </button>

                  <button
                    className="payment-option crypto"
                    onClick={async () => {
                      if (!isConnected) {
                        await connect();
                        return;
                      }
                      if (!isSepoliaNetwork) {
                        await switchNetwork('sepolia');
                        return;
                      }
                      handleCryptoPurchase();
                    }}
                  >
                    <span className="payment-icon">⟠</span>
                    <span className="payment-label">
                      {!isConnected
                        ? 'ウォレットを接続'
                        : !isSepoliaNetwork
                        ? 'Sepoliaに切替'
                        : 'Sepolia ETHで購入'}
                    </span>
                    <span className="payment-price">{ethPrice} ETH</span>
                  </button>
                </div>

                {isConnected && (
                  <p className="wallet-info">
                    接続中: {address?.slice(0, 6)}...{address?.slice(-4)}
                    {!isSepoliaNetwork && (
                      <span className="network-warning"> ⚠️ Sepoliaに切り替えてください</span>
                    )}
                  </p>
                )}

                <button className="modal-close-btn" onClick={closePurchaseModal}>
                  キャンセル
                </button>
              </>
            )}

            {purchaseStep === 'processing' && (
              <div className="modal-status">
                <div className="spinner"></div>
                <h2>処理中...</h2>
                <p>トランザクションを送信しています</p>
                <p className="modal-hint">MetaMaskで確認してください</p>
              </div>
            )}

            {purchaseStep === 'confirming' && (
              <div className="modal-status">
                <div className="spinner"></div>
                <h2>確認中...</h2>
                <p>ブロックチェーンで確認しています</p>
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    Etherscanで確認 →
                  </a>
                )}
              </div>
            )}

            {purchaseStep === 'success' && (
              <div className="modal-status success">
                <span className="status-icon">✓</span>
                <h2>購入完了！</h2>
                <p>「{item.title}」を購入しました</p>
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    Etherscanで確認 →
                  </a>
                )}
                <div className="success-share">
                  <ShareButton
                    title={`「${item.title}」を購入しました！`}
                    text={`¥${item.price.toLocaleString()}の商品をゲット！`}
                    url={window.location.href}
                    className="share-button-success"
                  />
                </div>
                <button className="modal-close-btn" onClick={closePurchaseModal}>
                  閉じる
                </button>
              </div>
            )}

            {purchaseStep === 'error' && (
              <div className="modal-status error">
                <span className="status-icon">✗</span>
                <h2>エラー</h2>
                <p>{purchaseError}</p>
                <button className="modal-close-btn" onClick={() => setPurchaseStep('select')}>
                  戻る
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
