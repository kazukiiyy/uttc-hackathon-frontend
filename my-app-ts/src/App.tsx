// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ItemCreatePage } from './pages/ItemCreatePages'; // さっきのフォームのページ

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layoutで囲むことで、配下のページ全てにタブバーがつきます */}
        <Route path="/" element={<Layout />}>
         
          <Route path="sell" element={<ItemCreatePage />} /> {/* ここで出品画面へ！ */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
