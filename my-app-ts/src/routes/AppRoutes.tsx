import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HomePage } from '../pages/HomePage';
import { SearchPage } from '../pages/SearchPage';
import { ItemCreatePage } from '../pages/ItemCreatePage';
import { MyPage } from '../pages/MyPage';
import { ItemDetailPage } from '../pages/ItemDetailPage';
import { DMPage } from '../pages/DMPage';
import { ProfilePage } from '../pages/ProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="sell" element={<ItemCreatePage />} />
        <Route path="mypage" element={<MyPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="dm/:recipientUid" element={<DMPage />} />
      </Route>
    </Routes>
  );
};
