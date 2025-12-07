import React from 'react';
// ↓ featuresフォルダに作った（これから作る）フォーム部品を読み込みます
import { ItemCreateForm } from '../features/items/components/ItemCreateForm';

export const ItemCreatePage = () => {
  return (
    <div className="page-container">
      {/* ヘッダー部分 */}
      <header style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold', textAlign: 'center' ,borderRadius: '12px' }}>
        商品の情報を入力
      </header>

      {/* メインのフォーム部分 */}
      <main style={{ padding: '16px' }}>
        <ItemCreateForm />
      </main>
    </div>
  );
};