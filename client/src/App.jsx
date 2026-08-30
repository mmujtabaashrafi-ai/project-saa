import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout Components
import Navigation from './components/Navigation';
import CallManager from './components/CallManager';

// ─── Protected Route ──────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ─── Admin Route ──────────────────────────────────────────────────────────
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
};

// ─── Public Route (redirect if logged in) ────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

// ─── Loading screen ───────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
    <div className="text-center">
      <div className="text-4xl mb-4 animate-bounce">✨</div>
      <div className="text-[var(--text-muted)] text-sm animate-pulse font-medium">
        Loading Saba's World…
      </div>
    </div>
  </div>
);

// ─── Routes where the bottom nav should be hidden (full-screen pages) ────
const FULLSCREEN_ROUTES = ['/chat', '/ai', '/admin', '/profile'];

// ─── Home Layout — shows Navigation with bottom bar ──────────────────────
const HomeLayout = ({ children }) => (
  <SocketProvider>
    <CallManager />
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop sidebar only on home layout */}
      <Navigation showBottomNav />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 md:ml-0">
        {children}
      </main>
    </div>
  </SocketProvider>
);

// ─── Full-Screen Layout — hides bottom nav, uses all available space ──────
const FullScreenLayout = ({ children }) => (
  <SocketProvider>
    <CallManager />
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop sidebar still shown on desktop, no mobile bottom bar */}
      <Navigation showBottomNav={false} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  </SocketProvider>
);

// ─── App Router ───────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Root redirect */}
    <Route path="/" element={<Navigate to="/home" replace />} />

    {/* Public: Login */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />

    {/* Home Hub — bottom nav visible */}
    <Route
      path="/home"
      element={
        <ProtectedRoute>
          <HomeLayout>
            <HomePage />
          </HomeLayout>
        </ProtectedRoute>
      }
    />

    {/* Chat — full screen, no bottom nav */}
    <Route
      path="/chat"
      element={
        <ProtectedRoute>
          <FullScreenLayout>
            <ChatPage />
          </FullScreenLayout>
        </ProtectedRoute>
      }
    />

    {/* AI Assistant — full screen, no bottom nav */}
    <Route
      path="/ai"
      element={
        <ProtectedRoute>
          <FullScreenLayout>
            <AIAssistantPage />
          </FullScreenLayout>
        </ProtectedRoute>
      }
    />

    {/* Profile - Own */}
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <FullScreenLayout>
            <ProfilePage />
          </FullScreenLayout>
        </ProtectedRoute>
      }
    />

    {/* Profile - By Username */}
    <Route
      path="/profile/:username"
      element={
        <ProtectedRoute>
          <FullScreenLayout>
            <ProfilePage />
          </FullScreenLayout>
        </ProtectedRoute>
      }
    />

    {/* Admin — full screen, no bottom nav */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <SocketProvider>
            <div className="flex h-dvh overflow-hidden bg-[var(--bg-primary)]">
              <Navigation showBottomNav={false} />
              <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <AdminPage />
              </main>
            </div>
          </SocketProvider>
        </AdminRoute>
      }
    />

    {/* Clean redirects for removed social-media feed routes */}
    <Route path="/home-feed" element={<Navigate to="/home" replace />} />
    <Route path="/explore" element={<Navigate to="/home" replace />} />
    <Route path="/reels" element={<Navigate to="/home" replace />} />
    <Route path="/notifications" element={<Navigate to="/home" replace />} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

// ─── Root App ─────────────────────────────────────────────────────────────
const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
