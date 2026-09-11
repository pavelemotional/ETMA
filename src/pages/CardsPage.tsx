import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { EntityType, ENTITY_LABELS, ENTITY_ICONS, StudyProgress } from '../types';
import { useCards, useCategories, useTags, useFieldDefinitions, useStudyProgress } from '../hooks/useFirestore';
import { ErrorDisplay, LoadingDisplay, EmptyState } from '../components/UI';
import EditCardModal from '../components/EditCardModal';

const CardsPage: React.FC = () => {
  const { entityType } = useParams<{ entityType: EntityType }>();
  const { user } = useAuth();

  const { data: cards = [], isLoading: cardsLoading, error: cardsError, refetch: refetchCards } = useCards(entityType);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(entityType);
  const { data: tags = [], isLoading: tagsLoading } = useTags(entityType);
  const { data: fields = [], isLoading: fieldsLoading } = useFieldDefinitions(entityType);
  const { data: progress = {}, refetch: refetchProgress } = useStudyProgress(user?.id || '', entityType);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [excludedCards, setExcludedCards] = useState<Set<string>>(new Set());

  const loading = cardsLoading || categoriesLoading || tagsLoading || fieldsLoading;
  const error = cardsError;

  const filteredCards = cards.filter(card => {
    if (selectedCategory !== 'all' && card.categoryId !== selectedCategory) return false;
    if (selectedTags.length > 0 && !selectedTags.some(t => card.tags.includes(t))) return false;
    if (excludedCards.has(card.id)) return false;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  // Отладка: логируем текущую карточку и теги
  if (currentCard) {
    console.log('=== Current Card Debug ===');
    console.log('Card ID:', currentCard.id);
    console.log('Card tags:', currentCard.tags);
    console.log('Card tags count:', currentCard.tags?.length || 0);
    console.log('Available tags:', tags);
    console.log('Available tags count:', tags.length);
    
    // Проверяем каждый тег карточки
    if (currentCard.tags && currentCard.tags.length > 0) {
      currentCard.tags.forEach(tagId => {
        const tag = tags.find(t => t.id === tagId);
        console.log(`Tag ID "${tagId}":`, tag ? `Found - ${tag.name}` : 'NOT FOUND');
      });
    }
  }

  const markStudied = async (correct: boolean) => {
    if (!currentCard || !user) return;
    const progId = `${user.id}_${currentCard.id}`;
    const existing = progress[progId];
    
    try {
      if (existing) {
        const updateData: any = {
          timesShown: increment(1),
          lastShown: Date.now(),
        };
        if (correct) updateData.timesCorrect = increment(1);
        if (correct && existing.timesCorrect + 1 >= 3) updateData.isLearned = true;
        await updateDoc(doc(db, 'progress', progId), updateData);
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
      }
      
      // Обновляем кэш
      await refetchProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Ошибка при сохранении прогресса');
      return;
    }
    
    setIsFlipped(false);
    
    // Исключаем текущую карточку из колоды
    const newExcluded = new Set(excludedCards);
    newExcluded.add(currentCard.id);
    setExcludedCards(newExcluded);
    
    // Переходим к следующей карточке
    if (filteredCards.length > 1) {
      setCurrentIndex(0);
    }
  };

  const skipCard = () => {
    if (!currentCard) return;
    
    // Исключаем текущую карточку из колоды
    const newExcluded = new Set(excludedCards);
    newExcluded.add(currentCard.id);
    setExcludedCards(newExcluded);
    
    // Переходим к следующей карточке
    if (filteredCards.length > 1) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  };

  const restartDeck = () => {
    setExcludedCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';
  const getTagName = (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (!tag) {
      console.warn(`Tag with ID "${id}" not found in tags array`);
      return '—';
    }
    return tag.name;
  };

  if (loading) {
    return <LoadingDisplay message="Загрузка карточек..." />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorDisplay error={error} onRetry={() => refetchCards()} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <span className="text-3xl">{ENTITY_ICONS[entityType!]}</span>
          <h1 className="text-2xl font-bold text-white">{ENTITY_LABELS[entityType!]}</h1>
        </div>

        {/* Filters - Compact */}
        <div className="glass rounded-xl px-3 py-2 mb-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setSelectedCategory('all'); setCurrentIndex(0); setIsFlipped(false); }}
                className={`px-2.5 py-1 rounded-full text-xs transition ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Все
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setCurrentIndex(0); setIsFlipped(false); }}
                  className={`px-2.5 py-1 rounded-full text-xs transition ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            {/* Separator */}
            {tags.length > 0 && <div className="w-px h-4 bg-gray-700" />}
            
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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
                    className={`px-2 py-0.5 rounded-full text-xs transition ${
                      selectedTags.includes(tag.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            
            {/* Counter */}
            <div className="ml-auto text-xs text-gray-500">
              {filteredCards.length} шт.
            </div>
          </div>
        </div>

        {/* Card Display */}
        {filteredCards.length === 0 ? (
          <EmptyState 
            icon="📭" 
            title="Нет карточек для отображения"
            description="Попробуйте изменить фильтры или добавьте карточки"
          />
        ) : currentCard ? (
          <div className="flex flex-col items-center animate-fade-in pb-32 md:pb-36">
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

            {/* Card Container */}
            <div className="w-full max-w-2xl relative">
              {/* Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer perspective-1000"
              >
                <div className={`grid transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="col-start-1 row-start-1 backface-hidden glass rounded-3xl p-4 md:p-6 shadow-2xl">
                    {/* Category and Tags */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 md:px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs md:text-sm font-medium">
                          {getCategoryName(currentCard.categoryId)}
                        </span>
                      </div>
                      {currentCard.tags && currentCard.tags.length > 0 && (
                        <div className="flex gap-1.5 md:gap-2 flex-wrap">
                          {currentCard.tags.map(tagId => {
                            const tagName = getTagName(tagId);
                            return (
                              <span key={tagId} className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs md:text-sm font-medium border border-blue-500/30">
                                {tagName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {currentCard.imageUrl && (
                      <div className="mb-3 bg-gray-900 rounded-xl overflow-hidden">
                        <img src={currentCard.imageUrl} alt="" className="w-full h-32 md:h-48 object-contain" />
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center py-3 md:py-4">
                      {fields.slice(0, 1).map(field => {
                        const value = currentCard.fields[field.id];
                        if (!value) return null;
                        return (
                          <div key={field.id} className="text-center">
                            <div className="text-xl md:text-3xl font-bold text-white">
                              {value}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-center text-gray-500 text-xs mt-2">
                      {isFlipped ? '' : 'Нажмите, чтобы перевернуть'}
                    </div>
                  </div>

                  {/* Back */}
                  <div className="col-start-1 row-start-1 backface-hidden rotate-y-180 glass rounded-3xl p-4 md:p-6 shadow-2xl max-h-[70vh] overflow-y-auto">
                    {/* Category and Tags */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 md:px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs md:text-sm font-medium">
                          {getCategoryName(currentCard.categoryId)}
                        </span>
                      </div>
                      {currentCard.tags && currentCard.tags.length > 0 && (
                        <div className="flex gap-1.5 md:gap-2 flex-wrap">
                          {currentCard.tags.map(tagId => {
                            const tagName = getTagName(tagId);
                            return (
                              <span key={tagId} className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs md:text-sm font-medium border border-blue-500/30">
                                {tagName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {currentCard.imageUrl && (
                      <div className="mb-3 bg-gray-900 rounded-xl overflow-hidden">
                        <img src={currentCard.imageUrl} alt="" className="w-full h-32 md:h-48 object-contain" />
                      </div>
                    )}
                    <h3 className="text-base md:text-xl font-bold text-white mb-3 text-center">Полная информация</h3>
                    <div className="space-y-2 md:space-y-3">
                      {fields.map(field => {
                        const value = currentCard.fields[field.id];
                        if (!value) return null;
                        return (
                          <div key={field.id} className="border-b border-gray-700 pb-2">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{field.name}</div>
                            <div className="text-xs md:text-base text-white leading-relaxed">{value}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-gray-500 text-xs mt-3">
                      {isFlipped ? 'Нажмите, чтобы перевернуть обратно' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress counter & Edit button */}
              {currentCard && user && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <div className="glass rounded-full px-2 md:px-4 py-1 md:py-2 flex items-center gap-1">
                    <span className="text-green-400 text-xs md:text-sm font-bold">
                      {progress[`${user.id}_${currentCard.id}`]?.timesCorrect || 0}
                    </span>
                    <span className="text-gray-400 text-xs">правильных</span>
                  </div>
                  {user.isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                      className="glass rounded-full p-2 hover:bg-white/10 transition"
                      title="Редактировать карточку"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Buttons - Fixed at bottom */}
              <div className="fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 md:gap-4 z-40 px-4">
                {/* Study mode controls */}
                {isFlipped && (
                  <div className="flex gap-2 md:gap-4 animate-fade-in w-full max-w-md justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); markStudied(false); }}
                      className="flex-1 px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition font-medium text-xs md:text-sm"
                    >
                      ❌ Неправильно
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); markStudied(true); }}
                      className="flex-1 px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition font-medium text-xs md:text-sm"
                    >
                      ✅ Правильно
                    </button>
                  </div>
                )}

                {/* Skip and Restart */}
                <div className="flex gap-2 md:gap-4 w-full max-w-md justify-center">
                  {!isFlipped && (
                    <button
                      onClick={(e) => { e.stopPropagation(); skipCard(); }}
                      className="flex-1 px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition font-medium text-xs md:text-sm"
                    >
                      ⏭️ Пропустить
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); restartDeck(); }}
                    className="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl transition font-medium text-xs md:text-sm"
                  >
                    🔄 Перезапустить колоду
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Edit Card Modal */}
        {showEditModal && currentCard && user?.isAdmin && (
          <EditCardModal
            card={currentCard}
            categories={categories}
            tags={tags}
            fields={fields}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              refetchCards();
              setShowEditModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CardsPage;
