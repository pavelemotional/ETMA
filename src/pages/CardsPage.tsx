import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, Category, Tag, EntityType, ENTITY_LABELS, ENTITY_ICONS, FieldDefinition, StudyProgress } from '../types';

const CardsPage: React.FC = () => {
  const { entityType } = useParams<{ entityType: EntityType }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [progress, setProgress] = useState<Record<string, StudyProgress>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityType) loadData();
  }, [entityType]);

  const loadData = async () => {
    if (!entityType) return;
    setLoading(true);
    try {
      const catQ = query(collection(db, 'categories'), where('entityType', '==', entityType));
      const catSnap = await getDocs(catQ);
      const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(cats);

      const tagQ = query(collection(db, 'tags'), where('entityType', '==', entityType));
      const tagSnap = await getDocs(tagQ);
      const tgs = tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
      setTags(tgs);

      const fieldQ = query(collection(db, 'fieldDefinitions'), where('entityType', '==', entityType));
      const fieldSnap = await getDocs(fieldQ);
      const flds = fieldSnap.docs.map(d => ({ id: d.id, ...d.data() } as FieldDefinition)).sort((a, b) => a.order - b.order);
      setFields(flds);

      const cardQ = query(collection(db, 'cards'), where('entityType', '==', entityType));
      const cardSnap = await getDocs(cardQ);
      const crds = cardSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card));
      setCards(crds);

      if (user) {
        const progQ = query(collection(db, 'progress'), where('userId', '==', user.id), where('entityType', '==', entityType));
        const progSnap = await getDocs(progQ);
        const prog: Record<string, StudyProgress> = {};
        progSnap.docs.forEach(d => {
          prog[d.id] = { id: d.id, ...d.data() } as StudyProgress;
        });
        setProgress(prog);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
    setLoading(false);
  };

  const filteredCards = cards.filter(card => {
    if (selectedCategory !== 'all' && card.categoryId !== selectedCategory) return false;
    if (selectedTags.length > 0 && !selectedTags.some(t => card.tags.includes(t))) return false;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  const markStudied = async (correct: boolean) => {
    if (!currentCard || !user) return;
    const progId = `${user.id}_${currentCard.id}`;
    const existing = progress[progId];
    
    if (existing) {
      const updateData: any = {
        timesShown: increment(1),
        lastShown: Date.now(),
      };
      if (correct) updateData.timesCorrect = increment(1);
      if (correct && existing.timesCorrect + 1 >= 3) updateData.isLearned = true;
      await updateDoc(doc(db, 'progress', progId), updateData);
      setProgress(prev => ({
        ...prev,
        [progId]: {
          ...existing,
          timesShown: existing.timesShown + 1,
          timesCorrect: existing.timesCorrect + (correct ? 1 : 0),
          lastShown: Date.now(),
          isLearned: existing.isLearned || (correct && existing.timesCorrect + 1 >= 3),
        }
      }));
    } else {
      const newProg: StudyProgress = {
        id: progId,
        userId: user.id,
        cardId: currentCard.id,
        entityType: entityType!,
        timesShown: 1,
        timesCorrect: correct ? 1 : 0,
        lastShown: Date.now(),
        isLearned: correct,
      };
      await setDoc(doc(db, 'progress', progId), newProg);
      setProgress(prev => ({ ...prev, [progId]: newProg }));
    }
    
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';
  const getTagName = (id: string) => tags.find(t => t.id === id)?.name || '—';

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
          <span className="text-3xl">{ENTITY_ICONS[entityType!]}</span>
          <h1 className="text-2xl font-bold text-white">{ENTITY_LABELS[entityType!]}</h1>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-6 animate-fade-in">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentIndex(0); setIsFlipped(false); }}
                className="bg-gray-800/50 text-white rounded-xl px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="all">Все категории</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {tags.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                        );
                        setCurrentIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs transition hover-lift ${
                        selectedTags.includes(tag.id)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-sm text-gray-400">
            Найдено карточек: <span className="text-white font-semibold">{filteredCards.length}</span>
          </div>
        </div>

        {/* Card Display */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">Нет карточек для отображения</p>
          </div>
        ) : currentCard ? (
          <div className="flex flex-col items-center animate-fade-in">
            {/* Progress indicator */}
            <div className="w-full max-w-2xl mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Карточка {currentIndex + 1} из {filteredCards.length}</span>
                <span>{Math.round(((currentIndex + 1) / filteredCards.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-2xl cursor-pointer perspective-1000"
            >
              <div className={`grid transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="col-start-1 row-start-1 backface-hidden glass rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                      {getCategoryName(currentCard.categoryId)}
                    </span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {currentCard.tags.map(tagId => (
                        <span key={tagId} className="px-2 py-1 bg-gray-800/50 text-gray-300 rounded text-xs">
                          {getTagName(tagId)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                    {fields.slice(0, 1).map(field => {
                      const value = currentCard.fields[field.id];
                      if (!value) return null;
                      return (
                        <div key={field.id} className="text-center">
                          <div className="text-3xl font-bold text-white">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center text-gray-500 text-sm mt-4">
                    {isFlipped ? '' : 'Нажмите, чтобы перевернуть'}
                  </div>
                </div>

                {/* Back */}
                <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 glass rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-6 text-center">Полная информация</h3>
                  <div className="space-y-4">
                    {fields.map(field => {
                      const value = currentCard.fields[field.id];
                      if (!value) return null;
                      return (
                        <div key={field.id} className="border-b border-gray-700 pb-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{field.name}</div>
                          <div className="text-white leading-relaxed">{value}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-gray-500 text-sm mt-6">
                    {isFlipped ? 'Нажмите, чтобы перевернуть обратно' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Study mode controls */}
            {isFlipped && (
              <div className="flex gap-4 mt-6 animate-fade-in">
                <button
                  onClick={() => markStudied(false)}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition font-medium hover-lift"
                >
                  ❌ Не знаю
                </button>
                <button
                  onClick={() => markStudied(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition font-medium hover-lift"
                >
                  ✅ Знаю
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
                disabled={currentIndex === 0}
                className="px-4 py-2 glass hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition hover-lift"
              >
                ← Назад
              </button>
              <button
                onClick={() => { setCurrentIndex(prev => Math.min(filteredCards.length - 1, prev + 1)); setIsFlipped(false); }}
                disabled={currentIndex >= filteredCards.length - 1}
                className="px-4 py-2 glass hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition hover-lift"
              >
                Вперёд →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CardsPage;
