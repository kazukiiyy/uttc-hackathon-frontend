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

type PurchaseStep = 'processing' | 'confirming' | 'success' | 'error';

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
    getItem: getChainItem,
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
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('processing');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // 出品者向け：受け取り確認の状態
  const [chainItemStatus, setChainItemStatus] = useState<number | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

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

  // 出品者が自分の商品を見ている場合、ブロックチェーンのステータスを取得
  useEffect(() => {
    const fetchChainStatus = async () => {
      if (!item || !user || user.uid !== item.uid) {
        setChainItemStatus(null);
        return;
      }

      // 出品者の商品で、chain_item_idがある場合のみ
      if (!item.chain_item_id) {
        setChainItemStatus(null);
        return;
      }

      // Sepoliaネットワークに接続されている場合のみ
      if (!isSepoliaNetwork) {
        setChainItemStatus(null);
        return;
      }

      setIsLoadingStatus(true);
      try {
        const chainItem = await getChainItem(item.chain_item_id);
        setChainItemStatus(Number(chainItem.status));
      } catch (err) {
        console.error('Failed to fetch chain item status:', err);
        setChainItemStatus(null);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchChainStatus();
  }, [item, user, isSepoliaNetwork, getChainItem]);

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

  // 購入ボタンクリック - 直接購入処理を開始
  const handlePurchaseClick = async () => {
    if (!item || !user) return;

    // ウォレットが接続されていない場合は接続を促す
    if (!isConnected) {
      await connect();
      return;
    }

    // Sepoliaネットワークでない場合は切り替えを促す
    if (!isSepoliaNetwork) {
      await switchNetwork('sepolia');
      return;
    }

    // 購入処理を実行（handleCryptoPurchase内でモーダル管理）
    await handleCryptoPurchase();
  };

  // スマートコントラクト経由で購入
  const handleCryptoPurchase = async () => {
    if (!item || !user || !address) return;

    // モーダルを開く
    setShowPurchaseModal(true);
    setPurchaseStep('processing');
    setPurchaseError(null);
    setTxHash(null);

    // chain_item_idが必要（スマートコントラクト上のID）
    // 既存のDBのidではなく、chain_item_idを使用
    const chainItemId = item.chain_item_id;
    if (!chainItemId) {
      setPurchaseError('この商品はブロックチェーン上に登録されていません');
      setPurchaseStep('error');
      setIsPurchasing(false);
      return;
    }

    setIsPurchasing(true);

    try {
      // 購入前に商品のステータスと価格を確認
      let priceWei: bigint;
      if (isSepoliaNetwork) {
        try {
          const chainItem = await getChainItem(chainItemId);
          const status = Number(chainItem.status);
          // 0 = Listed, 1 = Purchased, 2 = Completed, 3 = Cancelled
          if (status !== 0) {
            let statusMessage = 'この商品は購入できません';
            if (status === 1) {
              statusMessage = 'この商品は既に購入済みです';
            } else if (status === 2) {
              statusMessage = 'この商品は取引が完了済みです';
            } else if (status === 3) {
              statusMessage = 'この商品は出品がキャンセルされています';
            }
            setPurchaseError(statusMessage);
            setPurchaseStep('error');
            setIsPurchasing(false);
            return;
          }
          // スマートコントラクトから取得した価格を使用（Wei単位）
          priceWei = BigInt(chainItem.price.toString());
        } catch (statusErr) {
          // ステータス取得に失敗した場合は、DBの価格から計算（フォールバック）
          console.warn('商品情報の取得に失敗しました。DBの価格を使用します:', statusErr);
          priceWei = jpyToWei(item.price);
        }
      } else {
        // Sepoliaネットワークでない場合はDBの価格から計算
        priceWei = jpyToWei(item.price);
      }
      
      // トランザクション送信
      setPurchaseStep('processing');
      const hash = await buyItem({
        itemId: chainItemId,
        priceWei,
        buyerUid: user.uid,
      });

      setTxHash(hash);
      setPurchaseStep('confirming');

      // トランザクション完了後、UIを更新
      setItem({ ...item, ifPurchased: true });
      setPurchaseStep('success');
    } catch (err: any) {
      console.error('購入エラー:', err);
      
      // エラーメッセージを適切に表示
      let errorMessage = '購入に失敗しました';
      if (err.message) {
        errorMessage = err.message;
        // よくあるエラーメッセージを日本語化
        if (err.message.includes('Seller cannot buy their own item') || 
            err.message.includes('出品者は自分の商品を購入できません')) {
          errorMessage = '出品者は自分の商品を購入できません';
        } else if (err.message.includes('Insufficient payment') || 
                   err.message.includes('insufficient funds')) {
          errorMessage = '残高が不足しています';
        } else if (err.message.includes('Item is not available for purchase')) {
          errorMessage = 'この商品は購入できません（既に購入済み、キャンセル済み、または完了済みです）';
        } else if (err.message.includes('Item is not available') || 
                   err.message.includes('Item does not exist')) {
          errorMessage = 'この商品は購入できません（既に購入済みまたは存在しません）';
        } else if (err.message.includes('トランザクションがキャンセル')) {
          errorMessage = 'トランザクションがキャンセルされました';
        }
      }
      
      setPurchaseError(errorMessage);
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
                  <span className="price-currency">⟠</span>
                  {ethPrice} ETH
                </p>
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
                  text={`${ethPrice} ETH - ${item.explanation.slice(0, 50)}...`}
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

          {/* 出品者向け：受け取り確認の状態表示 */}
          {isOwnItem && item.chain_item_id && (
            <div className="receipt-status-section">
              {isLoadingStatus ? (
                <div className="receipt-status-loading">
                  <p>状態を確認中...</p>
                </div>
              ) : chainItemStatus !== null ? (
                <div className="receipt-status">
                  {chainItemStatus === 1 ? (
                    <div className="receipt-status-pending">
                      <span className="status-icon">⏳</span>
                      <span className="status-text">未承認です</span>
                      <p className="status-description">
                        購入者が受け取り確認をすると、代金が自動的に送金されます。
                      </p>
                    </div>
                  ) : chainItemStatus === 2 ? (
                    <div className="receipt-status-completed">
                      <span className="status-icon">✓</span>
                      <span className="status-text">受け取り済み</span>
                      <p className="status-description">
                        受け取り確認が完了し、代金が送金されました。
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : !isSepoliaNetwork ? (
                <div className="receipt-status-info">
                  <p>Sepoliaネットワークに接続すると、受け取り確認の状態を確認できます。</p>
                </div>
              ) : null}
            </div>
          )}

          {!isOwnItem && !item.ifPurchased && (
            <div className="purchase-section">
              <button
                onClick={handlePurchaseClick}
                className="purchase-button"
                disabled={isPurchasing}
              >
                {isPurchasing ? '処理中...' : !isConnected ? 'ウォレットを接続して購入' : !isSepoliaNetwork ? 'Sepoliaに切り替えて購入' : `${ethPrice} ETHで購入する`}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 購入処理モーダル */}
      {showPurchaseModal && (
        <div className="purchase-modal-overlay" onClick={closePurchaseModal}>
          <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
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
                    text={`${ethPrice} ETHの商品をゲット！`}
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
                <button className="modal-close-btn" onClick={closePurchaseModal}>
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
