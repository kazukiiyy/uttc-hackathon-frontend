import React from 'react';
import {
  FaTshirt,
  FaMobileAlt,
  FaGamepad,
  FaRunning,
  FaBook,
  FaSprayCan,
  FaUtensils,
  FaEllipsisH,
} from 'react-icons/fa';
import './SearchPage.css';

const categoryData = [
  { name: 'ファッション', Icon: FaTshirt },
  { name: '家電・スマホ', Icon: FaMobileAlt },
  { name: 'ホビー・ゲーム', Icon: FaGamepad },
  { name: 'スポーツ', Icon: FaRunning },
  { name: '本・音楽', Icon: FaBook },
  { name: 'コスメ・美容', Icon: FaSprayCan },
  { name: '食品・飲料', Icon: FaUtensils },
  { name: 'その他', Icon: FaEllipsisH },
];

export const SearchPage = () => {
  return (
    <div className="search-page">
      <header className="search-header">
        <input
          type="text"
          className="search-input"
          placeholder="商品を検索..."
        />
      </header>

      <main className="search-main">
        <section className="search-section">
          <h3>カテゴリから探す</h3>
          <div className="category-grid">
            {categoryData.map(({ name, Icon }) => (
              <div key={name} className="category-item">
                <Icon className="category-icon" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="search-section">
          <h3>検索結果</h3>
          <p className="placeholder-text">検索してください</p>
        </section>
      </main>
    </div>
  );
};
