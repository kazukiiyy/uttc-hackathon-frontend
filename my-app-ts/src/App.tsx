import { BrowserRouter, Routes, Route ,Navigate} from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ItemCreatePage } from './pages/ItemCreatePages'; // さっきのフォームのページ
import { GoogleLoginPage } from './pages/Login/GoogleLoginPage';
import { ProtectedRoute } from "./pages/Login/ProtectedRouter"

const App = () => {
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Layoutで囲むことで、配下のページ全てにタブバーがつきます */}
        <Route path="/login" element={<GoogleLoginPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        } >
         
          
          <Route path="sell" element={<ItemCreatePage />} /> 

        </Route >
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;
