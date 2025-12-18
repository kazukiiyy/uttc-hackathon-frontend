import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, WalletProvider } from './contexts';
import { AppRoutes } from './routes';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <AppRoutes />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
