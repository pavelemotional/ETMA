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
  const [mode, setMode] = useState<'browse' | 'study'>('browse');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityType) loadData();
  }, [entityType]);

  const loadData = async () => {
    if (!entityType) return;
    setLoading(true);
    try {
      // Load categories
      const catQ = query(collection(db, 'categories'), where('entityType', '==', entityType));
      const catSnap = await getDocs(catQ);
      const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(cats);

      // Load tags
      const tagQ = query(collection(db, 'tags'), where('entityType', '==', entityType));
      const tagSnap = await getDocs(tagQ);
      const tgs = tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
      setTags(tgs);

      // Load fields
      const fieldQ = query(collection(db, 'fieldDefinitions'), where('entityType', '==', entityType));
      const fieldSnap = await getDocs(fieldQ);
      const flds = fieldSnap.docs.map(d => ({ id: d.id, ...d.data() } as FieldDefinition)).sort((a, b) => a.order - b.order);
      setFields(flds);

      // Load cards
      const cardQ = query(collection(db, 'cards'), where('entityType', '==', entityType));
      const cardSnap = await getDocs(cardQ);
      const crds = cardSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card));
      setCards(crds);

      // Load progress
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
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition text-2xl">←</button>
            <span className="text-3xl">{ENTITY_ICONS[entityType!]}</span>
            <h1 className="text-2xl font-bold text-white">{ENTITY_LABELS[entityType!]}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('browse'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`px-4 py-2 rounded-lg transition text-sm ${mode === 'browse' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              📋 Просмотр
            </button>
            <button
              onClick={() => { setMode('study'); setCurrentIndex(0); setIsFlipped(false); }}
              className={`px-4 py-2 rounded-lg transition text-sm ${mode === 'study' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              🎓 Изучение
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4">
            {/* Category filter */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentIndex(0); setIsFlipped(false); }}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Все категории</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {/* Tags filter */}
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
                      className={`px-3 py-1 rounded-full text-xs transition ${
                        selectedTags.includes(tag.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">Нет карточек для отображения</p>
          </div>
        ) : currentCard ? (
          <div className="flex flex-col items-center">
            {/* Progress indicator */}
            <div className="w-full max-w-2xl mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Карточка {currentIndex + 1} из {filteredCards.length}</span>
                <span>{Math.round(((currentIndex + 1) / filteredCards.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-2xl min-h-[400px] cursor-pointer perspective-1000"
            >
              <div className={`relative w-full min-h-[400px] transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                      {getCategoryName(currentCard.categoryId)}
                    </span>
                    <div className="flex gap-1">
                      {currentCard.tags.map(tagId => (
                        <span key={tagId} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          {getTagName(tagId)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center h-[280px]">
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

                  <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
                    {isFlipped ? '' : 'Нажмите, чтобы перевернуть'}
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-6 text-center">Полная информация</h3>
                  <div className="space-y-4">
                    {fields.map(field => {
                      const value = currentCard.fields[field.id];
                      if (!value) return null;
                      return (
                        <div key={field.id} className="border-b border-gray-700 pb-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{field.name}</div>
                          <div className="text-white">{value}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Study mode controls */}
            {mode === 'study' && isFlipped && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => markStudied(false)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium"
                >
                  ❌ Не знаю
                </button>
                <button
                  onClick={() => markStudied(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-medium"
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
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
              >
                ← Назад
              </button>
              <button
                onClick={() => { setCurrentIndex(prev => Math.min(filteredCards.length - 1, prev + 1)); setIsFlipped(false); }}
                disabled={currentIndex >= filteredCards.length - 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
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
