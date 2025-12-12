import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts';
import { itemsApi } from '../../../api';
import './ItemCreateForm.css';

export const ItemCreateForm = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? '出品中...' : '出品する'}
        </button>
      </form>
    </div>
  );
};
