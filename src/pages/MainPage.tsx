import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EntityType, ENTITY_LABELS, ENTITY_ICONS } from '../types';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const entities: EntityType[] = ['wine', 'kitchen', 'bar'];

  const entityDescriptions: Record<EntityType, string> = {
    wine: 'Изучайте винную карту: игристые, белые, красные, розе и оранжевые вина',
    kitchen: 'Закуски, салаты, супы, горячие блюда и десерты',
    bar: 'Кофе, коктейли и крепкий алкоголь',
  };

  const entityColors: Record<EntityType, string> = {
    wine: 'from-purple-600 to-pink-600',
    kitchen: 'from-orange-600 to-red-600',
    bar: 'from-blue-600 to-cyan-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Привет, {user?.username}! 👋
            </h1>
            <p className="text-gray-400 mt-1">Выберите раздел для изучения</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/stats')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
            >
              📊 Статистика
            </button>
            {user?.isAdmin && (
              <>
                <button
                  onClick={() => navigate('/admin/content')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm"
                >
                  ✏️ Контент
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                >
                  👥 Пользователи
                </button>
                <button
                  onClick={() => navigate('/admin/stats')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition text-sm"
                >
                  📈 Аналитика
                </button>
              </>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition text-sm"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Entity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {entities.map((entity) => (
            <button
              key={entity}
              onClick={() => navigate(`/cards/${entity}`)}
              className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${entityColors[entity]} opacity-90`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">{ENTITY_ICONS[entity]}</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {ENTITY_LABELS[entity]}
                </h2>
                <p className="text-white/80 text-sm">
                  {entityDescriptions[entity]}
                </p>
                <div className="mt-4 inline-flex items-center text-white/90 text-sm font-medium group-hover:text-white transition">
                  Начать изучение →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainPage;
