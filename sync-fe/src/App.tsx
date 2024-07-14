import {
  AuthContext,
  type AuthContextData,
  ThemeContext,
  WebSocketProvider,
} from './context';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Router from './Router';
import { Toaster } from './components/ui/toaster';

const queryClient = new QueryClient();

export default () => {
  const [theme, setTheme] = useState('dark');
  const [authData, setAuthData] = useState<AuthContextData>({
    roomId: '',
    name: '',
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <AuthContext.Provider value={{ data: authData, setAuthData }}>
        <QueryClientProvider client={queryClient}>
          <WebSocketProvider>
            <Router />
            <Toaster />
          </WebSocketProvider>
        </QueryClientProvider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};
