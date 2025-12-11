// src/features/items/components/ItemCreateForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ItemCreateForm.css'; 

// 認証情報を取得するためのフックをインポート
import { useAuth } from '../../../features/firebase/useAuth'; 
// API関数をインポート（この後のステップで作成します）
import { createItem } from '../../../api/ItemCreateApi'

export const ItemCreateForm: React.FC = () => {
  // 🌟 useAuth を使って認証情報とローディング状態を取得
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [explanation, setExplanation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信状態管理を追加

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

    // 1. 認証チェック
    if (loading || !user) {
        alert("認証情報を確認できません。ログイン状態を確認してください。");
        return;
    }

    // 2. 必須項目チェック（画像も必須と仮定）
    if (!title || !price || !explanation || !image) {
        alert("全ての項目を入力し、画像をアップロードしてください。");
        return;
    }
    
    setIsSubmitting(true);

    // 🌟 3. UIDをAPI関数に渡す
    const sellerUid = user.uid; 
    
    try {
        await createItem({
          title,
          price, // 数値型に変換
          explanation,
          image, // image -> imageFile に名前を変更
          sellerUid,
        });

        alert("出品が完了しました！");
        navigate('/'); // 成功後、ページ遷移
    } catch (error){
        console.error("商品登録エラー:", error);
        alert("商品データの送信中にエラーが発生しました。コンソールを確認してください。");
    } finally {
        setIsSubmitting(false);
    }
  };

  // 認証情報ロード中の表示
  if (loading) {
    return <div className="form-container">認証情報を読み込み中...</div>;
  }
  
  // ログインしていない場合（通常はProtectedRouteで弾かれるが、念のため）
  if (!user) {
    return <div className="form-container">ログインが必要です。</div>;
  }
  
  // ... (フォームのレンダリング) ...
  return (
    <div className="form-container">
      <h2 className="form-title">商品を出品</h2>
      
      <form onSubmit={handleSubmit}>
        {/* ... (中略：画像、タイトル、価格、説明の入力フィールドは変更なし) ... */}

        {/* 画像アップロード部分 */}
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
                <span>📷 クリックして写真をアップロード</span>
              </div>
            )}
          </label>
        </div>

        {/* 商品名 */}
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

        {/* 価格 */}
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

        {/*　商品の説明　*/}
        <div className="input-group">
            <label className="label">商品の説明</label>
            <textarea
            className="input-field textarea-field"
            value={explanation}
            onChange={((e)=> setExplanation(e.target.value))}
            placeholder="未使用新品同様です。"
            rows={3}
            />
        </div>
        
        {/* 出品ボタン */}
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? '出品中...' : '出品する'}
        </button>
      </form>
    </div>
  );
};