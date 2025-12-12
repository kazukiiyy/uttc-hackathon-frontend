import { useAuth } from '../contexts';
import './HomePage.css';

export const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>フリマアプリ</h1>
      </header>

      <main className="home-main">
        <div className="welcome-section">
          <h2>ようこそ、{user?.displayName || 'ゲスト'}さん</h2>
          <p>商品を探したり、出品したりしてみましょう。</p>
        </div>

        <section className="home-section">
          <h3>おすすめ商品</h3>
          <p className="placeholder-text">商品が表示されます</p>
        </section>

        <section className="home-section">
          <h3>新着商品</h3>
          <p className="placeholder-text">商品が表示されます</p>
        </section>
      </main>
    </div>
  );
};
