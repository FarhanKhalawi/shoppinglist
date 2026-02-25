import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WelcomePage } from './components/WelcomePage';
import { AuthPage } from './components/AuthPage';
import { AuthCallback } from './components/AuthCallback';
import { Dashboard } from './components/Dashboard';
import { ListDetail } from './components/ListDetail';
import { Settings } from './components/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initDB } from './lib/db';

// Initialize IndexedDB on app start
initDB().catch(console.error);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Router component that handles session_id detection
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id synchronously during render
  // This prevents race conditions with ProtectedRoute's auth check
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/welcome" element={<WelcomeWithAuth />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/list/:listId"
        element={
          <ProtectedRoute>
            <ListDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

// Welcome page with auth buttons
function WelcomeWithAuth() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WelcomePage />
      <AuthButtons />
    </div>
  );
}

function AuthButtons() {
  const navigate = (path) => {
    window.location.href = path;
  };

  return (
    <div className="fixed bottom-0 inset-x-0 p-6 glass border-t border-border safe-area-inset-bottom">
      <div className="max-w-md mx-auto space-y-3">
        <button
          onClick={() => navigate('/auth')}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-primary/90 transition-colors touch-feedback"
          data-testid="get-started-btn"
        >
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
            <Toaster 
              position="top-center" 
              richColors 
              dir="rtl"
              toastOptions={{
                className: 'font-tajawal'
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
