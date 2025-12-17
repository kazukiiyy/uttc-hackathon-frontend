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

  // ブロックチェーン出品用
  const [listingStep, setListingStep] = useState<ListingStep>('form');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);
  const [useBlockchain, setUseBlockchain] = useState(false);

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

  // 従来のAPI経由での出品
  const handleTraditionalSubmit = async () => {
    if (!user || !image) return;

    try {
      await itemsApi.create({
        title,
        price,
        explanation,
        category,
        image,
        sellerUid: user.uid,
      });

      alert('出品が完了しました！');
      navigate('/');
    } catch (error) {
      console.error('商品登録エラー:', error);
      alert('商品データの送信中にエラーが発生しました。');
    }
  };

  // ブロックチェーン経由での出品
  const handleBlockchainSubmit = async (imageUrl: string) => {
    if (!user || !address) return;

    setListingStep('processing');
    setListingError(null);

    try {
      const result = await listItem({
        title,
        priceJpy: parseInt(price),
        explanation,
        imageUrl,
        uid: user.uid,
        category,
        tokenURI: imageUrl, // NFTメタデータURL（簡易版）
      });

      setTxHash(result.txHash);
      setListingStep('confirming');

      // トランザクション完了
      setListingStep('success');
    } catch (err: any) {
      console.error('ブロックチェーン出品エラー:', err);
      setListingError(err.message || '出品に失敗しました');
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

    setIsSubmitting(true);

    try {
      if (useBlockchain) {
        // ブロックチェーン出品の場合、まず画像をアップロード
        const formData = new FormData();
        formData.append('image', image);
        formData.append('title', title);
        formData.append('price', price);
        formData.append('explanation', explanation);
        formData.append('category', category);
        formData.append('sellerUid', user.uid);

        // 画像アップロードのみ実行してURLを取得
        const response = await itemsApi.create({
          title,
          price,
          explanation,
          category,
          image,
          sellerUid: user.uid,
        });

        // APIから画像URLを取得してブロックチェーンに出品
        // 注: 実際にはAPIを修正して画像URLのみ返すエンドポイントが必要
        // ここでは仮のURLを使用
        const imageUrl = response?.image_urls?.[0] || '';
        await handleBlockchainSubmit(imageUrl);
      } else {
        await handleTraditionalSubmit();
      }
    } catch (error) {
      console.error('商品登録エラー:', error);
      if (!useBlockchain) {
        alert('商品データの送信中にエラーが発生しました。');
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
            type="number"
            className="input-field"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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

        {/* ブロックチェーン出品オプション */}
        <div className="blockchain-option">
          <label className="blockchain-toggle">
            <input
              type="checkbox"
              checked={useBlockchain}
              onChange={(e) => setUseBlockchain(e.target.checked)}
            />
            <span className="toggle-label">
              <span className="toggle-icon">⟠</span>
              ブロックチェーンに出品 (Sepolia)
            </span>
          </label>
          {useBlockchain && (
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
                  接続中: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting || (useBlockchain && (!isConnected || !isSepoliaNetwork))}
        >
          {isSubmitting
            ? '出品中...'
            : useBlockchain
            ? `${ethPrice} ETH で出品する`
            : '出品する'}
        </button>
      </form>
    </div>
  );
};
