import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ReelsPage from './pages/ReelsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AIAssistantPage from './pages/AIAssistantPage';

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

// ─── Main App Layout (with Navigation + CallManager) ─────────────────────
const AppLayout = ({ children }) => (
  <SocketProvider>
    <CallManager />
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Navigation />
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

    {/* Social Feed */}
    <Route
      path="/home"
      element={
        <ProtectedRoute>
          <AppLayout>
            <FeedPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Explore / Search */}
    <Route
      path="/explore"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ExplorePage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Reels */}
    <Route
      path="/reels"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ReelsPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Notifications */}
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <AppLayout>
            <NotificationsPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* AI Assistant */}
    <Route
      path="/ai"
      element={
        <ProtectedRoute>
          <AppLayout>
            <AIAssistantPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Chat (legacy + direct chat) */}
    <Route
      path="/chat"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ChatPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Profile - Own */}
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Profile - By Username */}
    <Route
      path="/profile/:username"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Admin */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <SocketProvider>
            <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
              <Navigation />
              <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <AdminPage />
              </main>
            </div>
          </SocketProvider>
        </AdminRoute>
      }
    />

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
