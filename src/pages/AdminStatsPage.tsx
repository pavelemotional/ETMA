import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, StudyProgress, Card, EntityType, ENTITY_LABELS } from '../types';

const AdminStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | 'all'>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersSnap, progSnap, cardsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'progress')),
        getDocs(collection(db, 'cards')),
      ]);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setProgress(progSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudyProgress)));
      setCards(cardsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const filteredProgress = selectedEntity === 'all' 
    ? progress 
    : progress.filter(p => p.entityType === selectedEntity);

  const filteredCards = selectedEntity === 'all'
    ? cards
    : cards.filter(c => c.entityType === selectedEntity);

  const totalCards = filteredCards.length;
  const totalProgressEntries = filteredProgress.length;
  const totalViews = filteredProgress.reduce((sum, p) => sum + p.timesShown, 0);
  const totalCorrect = filteredProgress.reduce((sum, p) => sum + p.timesCorrect, 0);
  const learnedCount = filteredProgress.filter(p => p.isLearned).length;
  const overallAccuracy = totalViews > 0 ? Math.round((totalCorrect / totalViews) * 100) : 0;

  const getUserStats = (userId: string) => {
    const userProgress = filteredProgress.filter(p => p.userId === userId);
    return {
      studied: userProgress.length,
      learned: userProgress.filter(p => p.isLearned).length,
      views: userProgress.reduce((sum, p) => sum + p.timesShown, 0),
      correct: userProgress.reduce((sum, p) => sum + p.timesCorrect, 0),
      accuracy: userProgress.reduce((sum, p) => sum + p.timesShown, 0) > 0
        ? Math.round((userProgress.reduce((sum, p) => sum + p.timesCorrect, 0) / userProgress.reduce((sum, p) => sum + p.timesShown, 0)) * 100)
        : 0,
      lastActive: userProgress.length > 0 ? Math.max(...userProgress.map(p => p.lastShown)) : 0,
    };
  };

  const getEntityBreakdown = () => {
    const entities: EntityType[] = ['wine', 'kitchen', 'bar'];
    return entities.map(entity => {
      const entityCards = cards.filter(c => c.entityType === entity);
      const entityProgress = progress.filter(p => p.entityType === entity);
      return {
        entity,
        totalCards: entityCards.length,
        studied: entityProgress.length,
        learned: entityProgress.filter(p => p.isLearned).length,
        views: entityProgress.reduce((sum, p) => sum + p.timesShown, 0),
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition text-2xl hover-lift">←</button>
          <h1 className="text-2xl font-bold text-white">📈 Аналитика</h1>
        </div>

        {/* Entity filter */}
        <div className="flex gap-2 mb-6 animate-fade-in">
          <button
            onClick={() => setSelectedEntity('all')}
            className={`px-4 py-2 rounded-xl transition text-sm hover-lift ${selectedEntity === 'all' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : 'glass text-gray-300 hover:bg-white/10'}`}
          >
            Все
          </button>
          {(['wine', 'kitchen', 'bar'] as EntityType[]).map(entity => (
            <button
              key={entity}
              onClick={() => setSelectedEntity(entity)}
              className={`px-4 py-2 rounded-xl transition text-sm hover-lift ${selectedEntity === entity ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : 'glass text-gray-300 hover:bg-white/10'}`}
            >
              {ENTITY_LABELS[entity]}
            </button>
          ))}
        </div>

        {/* Global Stats */}
        <div className="glass rounded-3xl p-6 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-4">Общая аналитика</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-purple-400">{users.length}</div>
              <div className="text-xs text-gray-400 mt-1">Пользователей</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-blue-400">{totalCards}</div>
              <div className="text-xs text-gray-400 mt-1">Всего карточек</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-green-400">{learnedCount}</div>
              <div className="text-xs text-gray-400 mt-1">Выучено</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-cyan-400">{totalViews}</div>
              <div className="text-xs text-gray-400 mt-1">Просмотров</div>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-amber-400">{overallAccuracy}%</div>
              <div className="text-xs text-gray-400 mt-1">Точность</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-2xl font-bold text-pink-400">{totalCards > 0 ? Math.round((learnedCount / totalCards) * 100) : 0}%</div>
              <div className="text-xs text-gray-400 mt-1">Пройдено</div>
            </div>
          </div>
        </div>

        {/* Entity Breakdown */}
        {selectedEntity === 'all' && (
          <div className="glass rounded-3xl p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">По разделам</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getEntityBreakdown().map((item, index) => (
                <div key={item.entity} className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 rounded-2xl p-4 hover-lift animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <h3 className="text-white font-semibold mb-3">{ENTITY_LABELS[item.entity]}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Карточек</span>
                      <span className="text-white">{item.totalCards}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Изучено</span>
                      <span className="text-white">{item.studied}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Выучено</span>
                      <span className="text-green-400">{item.learned}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Просмотров</span>
                      <span className="text-white">{item.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-user Stats */}
        <div className="glass rounded-3xl p-6 animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-4">Статистика по пользователям</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Пользователь</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Изучено</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Выучено</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Просмотров</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Точность</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Прогресс</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Последняя активность</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const stats = getUserStats(user.id);
                  const progressPercent = totalCards > 0 ? Math.round((stats.studied / totalCards) * 100) : 0;
                  return (
                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-white/5 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white">{user.username}</span>
                          {user.isAdmin && <span className="px-1.5 py-0.5 bg-amber-600/30 text-amber-300 text-xs rounded">admin</span>}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-white">{stats.studied}</td>
                      <td className="text-center py-3 px-4 text-green-400">{stats.learned}</td>
                      <td className="text-center py-3 px-4 text-white">{stats.views}</td>
                      <td className="text-center py-3 px-4 text-amber-400">{stats.accuracy}%</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full" style={{ width: `${progressPercent}%` }} />
                          </div>
                          <span className="text-gray-400 text-xs">{progressPercent}%</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-400 text-xs">
                        {stats.lastActive ? new Date(stats.lastActive).toLocaleDateString('ru-RU') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage;
