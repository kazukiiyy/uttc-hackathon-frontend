import React, { useState } from 'react';
import './ItemCreateForm.css'; // ★先ほどのCSSを読み込み
import {ItemData} from '../../../types/item'
import { createItem } from '../api/ItemCreateApi'

export const ItemCreateForm = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [explanation, setExplanation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        await createItem({
            title,
            price,
            explanation,
            image: imageFile,
        });

        alert("出品が完了しました！");
    } catch (error){
        console.error(error);
        alert("商品データの送信中にエラーが発生しました");
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">商品を出品</h2>
      
      <form onSubmit={handleSubmit}>
        {/* 画像アップロード部分 */}
        <div className="input-group">
          <span className="label">商品画像</span>
          <label className="image-upload-area">
            {/* inputは隠して、デザインされたdivをクリックさせるテクニック */}
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
        <button type="submit" className="submit-button">
          出品する
        </button>
      </form>
    </div>
  );
};