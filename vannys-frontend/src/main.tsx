import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { applyTheme, useThemeStore, watchSystemTheme } from './store/theme.store';
import './index.css';

// Appliquer le thème mémorisé avant le premier rendu, puis suivre le système
// tant que l'utilisateur est en mode « système ».
applyTheme(useThemeStore.getState().mode);
watchSystemTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'inherit', fontSize: '14px' },
            success: { iconTheme: { primary: '#c8a96e', secondary: '#fff' } },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
