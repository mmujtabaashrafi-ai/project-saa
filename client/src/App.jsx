import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

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
  if (!isAdmin) return <Navigate to="/chat" replace />;
  return children;
};

// ─── Public Route (redirect if logged in) ────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/chat" replace /> : children;
};

// ─── Loading screen ───────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
    <div className="text-center">
      <div className="text-4xl mb-4 animate-bounce">✨</div>
      <div className="text-[var(--text-muted)] text-sm animate-pulse font-medium">Loading Saba's World…</div>
    </div>
  </div>
);

// ─── App Router ───────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/chat"
      element={
        <ProtectedRoute>
          <SocketProvider>
            <ChatPage />
          </SocketProvider>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <SocketProvider>
            <AdminPage />
          </SocketProvider>
        </AdminRoute>
      }
    />
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
