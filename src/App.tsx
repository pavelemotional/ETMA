import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ensureAdminExists } from './initAdmin';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import CardsPage from './pages/CardsPage';
import BrowseCardsPage from './pages/BrowseCardsPage';
import StatsPage from './pages/StatsPage';
import AdminContentPage from './pages/AdminContentPage';
import AdminStatsPage from './pages/AdminStatsPage';
import AdminUsersPage from './pages/AdminUsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 2,
    },
  },
});

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" />;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      {children}
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
      <Route path="/cards/:entityType" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
      <Route path="/browse" element={<ProtectedRoute><BrowseCardsPage /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      <Route path="/admin/content" element={<ProtectedRoute adminOnly><AdminContentPage /></ProtectedRoute>} />
      <Route path="/admin/stats" element={<ProtectedRoute adminOnly><AdminStatsPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    ensureAdminExists();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
