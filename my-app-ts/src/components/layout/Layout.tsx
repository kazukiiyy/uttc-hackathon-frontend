import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNav';

export const Layout = () => {
  return (
    <div className="app-container">
      {/* ヘッダー */}
      <Header />
      
      {/* Outletの部分に、URLに応じたページが表示されます */}
      <div className="content-area">
        <Outlet />
      </div>
      
      {/* 下部のタブバーは常にここに表示 */}
      <BottomNavigation />
    </div>
  );
};