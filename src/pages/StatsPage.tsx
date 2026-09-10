import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { StudyProgress, Card, Category, EntityType, ENTITY_LABELS, ENTITY_ICONS } from '../types';

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const progQ = query(collection(db, 'progress'), where('userId', '==', user.id));
      const progSnap = await getDocs(progQ);
      setProgress(progSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudyProgress)));

      const cardsSnap = await getDocs(collection(db, 'cards'));
      setCards(cardsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card)));

      const catsSnap = await getDocs(collection(db, 'categories'));
      setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const entities: EntityType[] = ['wine', 'kitchen', 'bar'];

  const getStatsForEntity = (entity: EntityType) => {
    const entityCards = cards.filter(c => c.entityType === entity);
    const entityProgress = progress.filter(p => p.entityType === entity);
    const totalCards = entityCards.length;
    const studiedCards = entityProgress.length;
    const learnedCards = entityProgress.filter(p => p.isLearned).length;
    const totalViews = entityProgress.reduce((sum, p) => sum + p.timesShown, 0);
    const totalCorrect = entityProgress.reduce((sum, p) => sum + p.timesCorrect, 0);
    const accuracy = totalViews > 0 ? Math.round((totalCorrect / totalViews) * 100) : 0;
    
    return { totalCards, studiedCards, learnedCards, totalViews, totalCorrect, accuracy };
  };

  const overallStats = {
    totalCards: cards.length,
    studiedCards: progress.length,
    learnedCards: progress.filter(p => p.isLearned).length,
    totalViews: progress.reduce((sum, p) => sum + p.timesShown, 0),
    totalCorrect: progress.reduce((sum, p) => sum + p.timesCorrect, 0),
    accuracy: progress.reduce((sum, p) => sum + p.timesShown, 0) > 0
      ? Math.round((progress.reduce((sum, p) => sum + p.timesCorrect, 0) / progress.reduce((sum, p) => sum + p.timesShown, 0)) * 100)
      : 0,
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
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition text-2xl hover-lift">←</button>
          <h1 className="text-2xl font-bold text-white">📊 Моя статистика</h1>
        </div>

        {/* Overall Stats */}
        <div className="glass rounded-3xl p-6 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-4">Общая статистика</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-3xl font-bold text-purple-400">{overallStats.studiedCards}</div>
              <div className="text-sm text-gray-400 mt-1">Изучено карточек</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-3xl font-bold text-green-400">{overallStats.learnedCards}</div>
              <div className="text-sm text-gray-400 mt-1">Выучено</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-3xl font-bold text-blue-400">{overallStats.totalViews}</div>
              <div className="text-sm text-gray-400 mt-1">Всего просмотров</div>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-2xl p-4 text-center hover-lift">
              <div className="text-3xl font-bold text-amber-400">{overallStats.accuracy}%</div>
              <div className="text-sm text-gray-400 mt-1">Точность</div>
            </div>
          </div>
        </div>

        {/* Per-entity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {entities.map((entity, index) => {
            const stats = getStatsForEntity(entity);
            const progressPercent = stats.totalCards > 0 ? Math.round((stats.studiedCards / stats.totalCards) * 100) : 0;
            return (
              <div key={entity} className="glass rounded-3xl p-6 hover-lift animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{ENTITY_ICONS[entity]}</span>
                  <h3 className="text-lg font-bold text-white">{ENTITY_LABELS[entity]}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Прогресс</span>
                    <span className="text-white">{stats.studiedCards}/{stats.totalCards}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-green-600/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-green-400">{stats.learnedCards}</div>
                      <div className="text-xs text-gray-400">Выучено</div>
                    </div>
                    <div className="bg-amber-600/10 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-amber-400">{stats.accuracy}%</div>
                      <div className="text-xs text-gray-400">Точность</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category breakdown */}
        <div className="mt-8 glass rounded-3xl p-6 animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-4">По категориям</h2>
          <div className="space-y-3">
            {categories.map(cat => {
              const catCards = cards.filter(c => c.categoryId === cat.id);
              const catProgress = progress.filter(p => catCards.some(c => c.id === p.cardId));
              const learned = catProgress.filter(p => p.isLearned).length;
              const percent = catCards.length > 0 ? Math.round((catProgress.length / catCards.length) * 100) : 0;
              
              return (
                <div key={cat.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-300 truncate">{cat.name}</div>
                  <div className="flex-1 bg-gray-800 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="text-sm text-gray-400 w-20 text-right">
                    {learned}/{catCards.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
