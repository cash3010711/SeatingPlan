import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WeddingProvider } from './context/WeddingContext';
import { MainPage } from './pages/MainPage';
import { UsherPage } from './pages/UsherPage';
import { LookupPage } from './pages/LookupPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <WeddingProvider>
              <MainPage />
            </WeddingProvider>
          }
        />
        <Route
          path="/usher"
          element={
            <WeddingProvider>
              <UsherPage />
            </WeddingProvider>
          }
        />
        {/* /lookup is strictly decoupled from administrative WeddingProvider */}
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
