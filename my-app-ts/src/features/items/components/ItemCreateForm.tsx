import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useWallet } from '../../../contexts';
import { itemsApi } from '../../../api';
import './ItemCreateForm.css';

type ListingStep = 'form' | 'processing' | 'confirming' | 'success' | 'error';

export const ItemCreateForm = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    address,
    isConnected,
    isSepoliaNetwork,
    connect,
    switchNetwork,
    listItem,
    jpyToEthDisplay,
  } = useWallet();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ブロックチェーン出品用（常にonchain出品）
  const [listingStep, setListingStep] = useState<ListingStep>('form');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);

  const categories = [
    'ファッション',
    '家電・スマホ',
    'ホビー・ゲーム',
    'スポーツ',
    '本・音楽',
    'コスメ・美容',
    '食品・飲料',
    'その他',
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ブロックチェーン経由での出品（常にonchain出品）
  const handleBlockchainSubmit = async (imageUrl: string) => {
    if (!user || !address) {
      setListingError('ユーザーまたはウォレットが接続されていません');
      setListingStep('error');
      return;
    }

    if (!imageUrl) {
      setListingError('画像URLが取得できませんでした');
      setListingStep('error');
      return;
    }

    setListingStep('processing');
    setListingError(null);

    try {
      const priceInt = parseInt(price);
      if (isNaN(priceInt) || priceInt <= 0) {
        throw new Error('価格が無効です');
      }

      const result = await listItem({
        title,
        priceJpy: priceInt,
        explanation,
        imageUrl,
        uid: user.uid,
        category,
        tokenURI: imageUrl, // NFTメタデータURL（簡易版）
      });

      setTxHash(result.txHash);
      setListingStep('confirming');

      // トランザクション完了を待つ（tx.wait()はlistItem内で実行済み）
      setListingStep('success');
    } catch (err: any) {
      console.error('ブロックチェーン出品エラー:', err);
      
      // エラーメッセージを詳細に設定
      let errorMessage = '出品に失敗しました';
      if (err.message) {
        if (err.message.includes('user rejected') || err.message.includes('User denied')) {
          errorMessage = 'トランザクションがキャンセルされました';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = '残高が不足しています';
        } else if (err.message.includes('network')) {
          errorMessage = 'ネットワークエラーが発生しました';
        } else {
          errorMessage = err.message;
        }
      }
      
      setListingError(errorMessage);
      setListingStep('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || !user) {
      alert('認証情報を確認できません。ログイン状態を確認してください。');
      return;
    }

    if (!title || !price || !explanation || !category || !image) {
      alert('全ての項目を入力し、画像をアップロードしてください。');
      return;
    }

    // ウォレット接続チェック
    if (!isConnected) {
      alert('ウォレットを接続してください。');
      return;
    }

    if (!isSepoliaNetwork) {
      alert('Sepoliaネットワークに切り替えてください。');
      return;
    }

    setIsSubmitting(true);

    try {
      // ブロックチェーン出品（常にonchain出品）
      // 画像のみをアップロードしてURLを取得
      // 商品データはonchainイベントからDBに挿入される
      let imageUrl = '';
      
      try {
        // 画像のみをアップロードしてURLを取得
        const response = await itemsApi.uploadImage(image);
        imageUrl = response?.image_url || response?.image_urls?.[0] || '';
        
        if (!imageUrl) {
          throw new Error('画像URLの取得に失敗しました');
        }
      } catch (error: any) {
        console.error('画像アップロードエラー:', error);
        setListingError(`画像のアップロードに失敗しました: ${error.message || '不明なエラー'}`);
        setListingStep('error');
        setIsSubmitting(false);
        return;
      }

      // ブロックチェーンに出品（イベントからDBに挿入される）
      await handleBlockchainSubmit(imageUrl);
    } catch (error: any) {
      console.error('商品登録エラー:', error);
      // エラーはhandleBlockchainSubmitで処理される
      if (!listingError) {
        setListingError(error.message || '出品に失敗しました');
        setListingStep('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="form-container">認証情報を読み込み中...</div>;
  }

  if (!user) {
    return <div className="form-container">ログインが必要です。</div>;
  }

  // ETH価格を計算
  const ethPrice = price ? jpyToEthDisplay(parseInt(price)) : '0.000000';

  // 成功時のUI
  if (listingStep === 'success') {
    return (
      <div className="form-container">
        <div className="listing-status success">
          <span className="status-icon">✓</span>
          <h2>出品完了！</h2>
          <p>「{title}」をブロックチェーンに出品しました</p>
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
          <button className="submit-button" onClick={() => navigate('/')}>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 処理中・確認中のUI
  if (listingStep === 'processing' || listingStep === 'confirming') {
    return (
      <div className="form-container">
        <div className="listing-status">
          <div className="spinner"></div>
          <h2>{listingStep === 'processing' ? '処理中...' : '確認中...'}</h2>
          <p>
            {listingStep === 'processing'
              ? 'トランザクションを送信しています'
              : 'ブロックチェーンで確認しています'}
          </p>
          <p className="hint">MetaMaskで確認してください</p>
        </div>
      </div>
    );
  }

  // エラー時のUI
  if (listingStep === 'error') {
    return (
      <div className="form-container">
        <div className="listing-status error">
          <span className="status-icon">✗</span>
          <h2>エラー</h2>
          <p>{listingError}</p>
          <button className="submit-button" onClick={() => setListingStep('form')}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="form-title">商品を出品</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <span className="label">商品画像</span>
          <label className="image-upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {preview ? (
              <img src={preview} alt="プレビュー" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span>クリックして写真をアップロード</span>
              </div>
            )}
          </label>
        </div>

        <div className="input-group">
          <label className="label">商品名</label>
          <input
            type="text"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 限定スニーカー"
          />
        </div>

        <div className="input-group">
          <label className="label">価格 (円)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="input-field price-input"
            value={price}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setPrice(value);
            }}
            placeholder="3000"
          />
          {price && (
            <p className="eth-price-hint">≈ {ethPrice} ETH (Sepolia)</p>
          )}
        </div>

        <div className="input-group">
          <label className="label">商品の説明</label>
          <textarea
            className="input-field textarea-field"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="未使用新品同様です。"
            rows={3}
          />
        </div>

        <div className="input-group">
          <label className="label">カテゴリー</label>
          <select
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">カテゴリーを選択</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* ウォレット接続情報（常にonchain出品） */}
        <div className="blockchain-option">
          <div className="blockchain-info">
            {!isConnected ? (
              <button
                type="button"
                className="wallet-connect-btn"
                onClick={connect}
              >
                ウォレットを接続
              </button>
            ) : !isSepoliaNetwork ? (
              <button
                type="button"
                className="wallet-connect-btn"
                onClick={() => switchNetwork('sepolia')}
              >
                Sepoliaに切り替え
              </button>
            ) : (
              <p className="wallet-connected">
                <span className="toggle-icon">⟠</span>
                接続中: {address?.slice(0, 6)}...{address?.slice(-4)} (Sepolia)
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting || !isConnected || !isSepoliaNetwork}
        >
          {isSubmitting
            ? '出品中...'
            : `${ethPrice} ETH で出品する`}
        </button>
      </form>
    </div>
  );
};
