import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, Category, Tag, EntityType, ENTITY_LABELS, ENTITY_ICONS, FieldDefinition, StudyProgress } from '../types';

const BrowseCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [fields, setFields] = useState<Record<string, FieldDefinition[]>>({});
  const [progress, setProgress] = useState<Record<string, StudyProgress>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all categories
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));

      // Load all tags
      const tagSnap = await getDocs(collection(db, 'tags'));
      setTags(tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));

      // Load all fields
      const fieldSnap = await getDocs(collection(db, 'fieldDefinitions'));
      const fieldsByEntity: Record<string, FieldDefinition[]> = {};
      fieldSnap.docs.forEach(d => {
        const field = { id: d.id, ...d.data() } as FieldDefinition;
        if (!fieldsByEntity[field.entityType]) {
          fieldsByEntity[field.entityType] = [];
        }
        fieldsByEntity[field.entityType].push(field);
      });
      // Sort fields by order
      Object.keys(fieldsByEntity).forEach(entity => {
        fieldsByEntity[entity].sort((a, b) => a.order - b.order);
      });
      setFields(fieldsByEntity);

      // Load all cards
      const cardSnap = await getDocs(collection(db, 'cards'));
      setCards(cardSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card)));

      // Load user progress
      if (user) {
        const progQ = query(collection(db, 'progress'), where('userId', '==', user.id));
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

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';
  const getTagName = (id: string) => tags.find(t => t.id === id)?.name || '—';
  const getEntityIcon = (entityType: EntityType) => ENTITY_ICONS[entityType];
  const getEntityLabel = (entityType: EntityType) => ENTITY_LABELS[entityType];

  const getCorrectCount = (cardId: string) => {
    if (!user) return 0;
    const prog = progress[`${user.id}_${cardId}`];
    return prog?.timesCorrect || 0;
  };

  const isLearned = (cardId: string) => {
    if (!user) return false;
    const prog = progress[`${user.id}_${cardId}`];
    return prog?.isLearned || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition text-2xl hover-lift">←</button>
          <h1 className="text-2xl font-bold text-white">📚 Все карточки</h1>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-6 animate-fade-in">
          <div className="space-y-3">
            {/* Categories */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Категории</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm transition hover-lift ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Все
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm transition hover-lift ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs transition hover-lift ${
                        selectedTags.includes(tag.id)
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
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

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">Нет карточек для отображения</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card, index) => {
              const isExpanded = expandedCard === card.id;
              const correctCount = getCorrectCount(card.id);
              const learned = isLearned(card.id);
              const cardFields = fields[card.entityType] || [];
              
              return (
                <div
                  key={card.id}
                  className="glass rounded-2xl p-6 hover-lift animate-fade-in cursor-pointer transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getEntityIcon(card.entityType)}</span>
                      <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs">
                        {getCategoryName(card.categoryId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {learned && (
                        <span className="text-green-400 text-xs font-bold">✓ Выучено</span>
                      )}
                      <div className="glass rounded-full px-3 py-1 flex items-center gap-1">
                        <span className="text-green-400 text-sm font-bold">{correctCount}</span>
                        <span className="text-gray-400 text-xs">✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {card.tags.map(tagId => (
                        <span key={tagId} className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-xs">
                          {getTagName(tagId)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Image */}
                  {card.imageUrl && (
                    <img src={card.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
                  )}

                  {/* Title */}
                  <div className="text-xl font-bold text-white mb-2">
                    {cardFields[0] ? card.fields[cardFields[0].id] || '—' : '—'}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 animate-fade-in border-t border-gray-700 pt-4">
                      {cardFields.slice(1).map(field => {
                        const value = card.fields[field.id];
                        if (!value) return null;
                        return (
                          <div key={field.id}>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{field.name}</div>
                            <div className="text-white text-sm leading-relaxed">{value}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Expand indicator */}
                  <div className="mt-3 text-center text-gray-500 text-xs">
                    {isExpanded ? 'Нажмите, чтобы свернуть' : 'Нажмите, чтобы развернуть'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseCardsPage;
