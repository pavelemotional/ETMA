import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 glass border-b border-gray-700/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white font-bold text-lg hover-lift"
          >
            <span className="text-2xl">🍷</span>
            <span className="hidden sm:inline gradient-text">Restaurant Cards</span>
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/browse')}
              className={`px-3 py-2 rounded-xl transition text-sm hover-lift ${
                isActive('/browse')
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              📚 <span className="hidden md:inline">Все карточки</span>
            </button>
            
            <button
              onClick={() => navigate('/stats')}
              className={`px-3 py-2 rounded-xl transition text-sm hover-lift ${
                isActive('/stats')
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              📊 <span className="hidden md:inline">Статистика</span>
            </button>

            {user.isAdmin && (
              <>
                <button
                  onClick={() => navigate('/admin/content')}
                  className={`px-3 py-2 rounded-xl transition text-sm hover-lift ${
                    isActive('/admin/content')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  ✏️ <span className="hidden md:inline">Контент</span>
                </button>
                
                <button
                  onClick={() => navigate('/admin/users')}
                  className={`px-3 py-2 rounded-xl transition text-sm hover-lift ${
                    isActive('/admin/users')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  👥 <span className="hidden md:inline">Пользователи</span>
                </button>
                
                <button
                  onClick={() => navigate('/admin/stats')}
                  className={`px-3 py-2 rounded-xl transition text-sm hover-lift ${
                    isActive('/admin/stats')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  📈 <span className="hidden md:inline">Аналитика</span>
                </button>
              </>
            )}

            <div className="h-6 w-px bg-gray-700 mx-1" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-sm hidden lg:inline">{user.username}</span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-xl transition text-sm hover-lift"
            >
              <span className="hidden md:inline">Выйти</span>
              <span className="md:hidden">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
