import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EntityType, ENTITY_LABELS, ENTITY_ICONS } from '../types';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Привет, {user?.username}! 👋
          </h1>
          <p className="text-gray-400 mt-1">Выберите раздел для изучения</p>
        </div>

        {/* Entity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {entities.map((entity, index) => (
            <button
              key={entity}
              onClick={() => navigate(`/cards/${entity}`)}
              className="group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${entityColors[entity]} opacity-90`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
              <div className="relative z-10">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">{ENTITY_ICONS[entity]}</div>
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
