import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { itemsApi } from '../api/endpoints/items';
import { Item } from '../types';
import { getFullImageUrl } from '../utils/imageUrl';
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

const ITEMS_PER_PAGE = 20;

export const SearchPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleItemClick = (itemId: number) => {
    navigate(`/item/${itemId}`);
  };

  const loadItems = useCallback(async (category: string, pageNum: number, isNewCategory: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await itemsApi.getByCategory(category, pageNum, ITEMS_PER_PAGE);

      if (isNewCategory) {
        setItems(data);
      } else {
        setItems(prev => [...prev, ...data]);
      }

      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError('商品の取得に失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadItems(categoryName, 1, true);
  };

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && selectedCategory) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadItems(selectedCategory, nextPage, false);
    }
  }, [isLoading, hasMore, selectedCategory, page, loadItems]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore]);

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
              <div
                key={name}
                className={`category-item ${selectedCategory === name ? 'selected' : ''}`}
                onClick={() => handleCategoryClick(name)}
              >
                <Icon className="category-icon" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="search-section">
          <h3>
            {selectedCategory ? `${selectedCategory}の商品` : '検索結果'}
          </h3>
          {items.length > 0 ? (
            <>
              <div className="items-grid">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    onClick={() => handleItemClick(item.id)}
                  >
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img
                        src={getFullImageUrl(item.image_urls[0])}
                        alt={item.title}
                        className="item-image"
                      />
                    ) : (
                      <div className="item-image-placeholder">No Image</div>
                    )}
                    <div className="item-info">
                      <p className="item-title">{item.title}</p>
                      <p className="item-price">¥{item.price.toLocaleString()}</p>
                      {item.ifPurchased && <span className="sold-badge">売り切れ</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div ref={loadMoreRef} className="load-more-trigger">
                {isLoading && <p className="loading-text">読み込み中...</p>}
              </div>
            </>
          ) : isLoading ? (
            <p className="placeholder-text">読み込み中...</p>
          ) : error ? (
            <p className="placeholder-text error-text">{error}</p>
          ) : (
            <p className="placeholder-text">
              {selectedCategory ? '商品がありません' : 'カテゴリを選択してください'}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};
