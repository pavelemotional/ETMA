import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Card, Category, Tag, EntityType, ENTITY_LABELS, FieldDefinition } from '../types';

type Tab = 'cards' | 'categories' | 'tags' | 'fields';

const AdminContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('cards');
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('wine');
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Card editing state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  
  // Delete confirmation
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Category editing
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Tag editing
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  
  // Field editing
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedEntity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catSnap, tagSnap, fieldSnap, cardSnap] = await Promise.all([
        getDocs(query(collection(db, 'categories'), where('entityType', '==', selectedEntity))),
        getDocs(query(collection(db, 'tags'), where('entityType', '==', selectedEntity))),
        getDocs(query(collection(db, 'fieldDefinitions'), where('entityType', '==', selectedEntity))),
        getDocs(query(collection(db, 'cards'), where('entityType', '==', selectedEntity))),
      ]);

      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setTags(tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
      setFields(fieldSnap.docs.map(d => ({ id: d.id, ...d.data() } as FieldDefinition)).sort((a, b) => a.order - b.order));
      setCards(cardSnap.docs.map(d => ({ id: d.id, ...d.data() } as Card)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Card CRUD
  const saveCard = async (card: Partial<Card>) => {
    if (editingCard) {
      await updateDoc(doc(db, 'cards', editingCard.id), { ...card, updatedAt: Date.now() });
    } else {
      await addDoc(collection(db, 'cards'), { ...card, entityType: selectedEntity, createdAt: Date.now(), updatedAt: Date.now() });
    }
    setShowCardModal(false);
    setEditingCard(null);
    loadData();
  };

  const deleteCard = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'cards', id));
      await loadData();
      setCardToDelete(null);
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Ошибка при удалении: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Category CRUD
  const saveCategory = async (data: { name: string }) => {
    if (editingCategory) {
      await updateDoc(doc(db, 'categories', editingCategory.id), data);
    } else {
      await addDoc(collection(db, 'categories'), { ...data, entityType: selectedEntity });
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
    loadData();
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('Deleting category:', id);
      await deleteDoc(doc(db, 'categories', id));
      console.log('Category deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ошибка при удалении категории: ' + (error as Error).message);
    }
  };

  // Tag CRUD
  const saveTag = async (data: { name: string }) => {
    if (editingTag) {
      await updateDoc(doc(db, 'tags', editingTag.id), data);
    } else {
      await addDoc(collection(db, 'tags'), { ...data, entityType: selectedEntity });
    }
    setShowTagModal(false);
    setEditingTag(null);
    loadData();
  };

  const deleteTag = async (id: string) => {
    try {
      console.log('Deleting tag:', id);
      await deleteDoc(doc(db, 'tags', id));
      console.log('Tag deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Ошибка при удалении тега: ' + (error as Error).message);
    }
  };

  // Field CRUD
  const saveField = async (data: { name: string; order: number }) => {
    if (editingField) {
      await updateDoc(doc(db, 'fieldDefinitions', editingField.id), data);
    } else {
      await addDoc(collection(db, 'fieldDefinitions'), { ...data, entityType: selectedEntity });
    }
    setShowFieldModal(false);
    setEditingField(null);
    loadData();
  };

  const deleteField = async (id: string) => {
    try {
      console.log('Deleting field:', id);
      await deleteDoc(doc(db, 'fieldDefinitions', id));
      console.log('Field deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Ошибка при удалении поля: ' + (error as Error).message);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'cards', label: 'Карточки', icon: '🃏' },
    { key: 'categories', label: 'Категории', icon: '📁' },
    { key: 'tags', label: 'Теги', icon: '🏷️' },
    { key: 'fields', label: 'Поля', icon: '📝' },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">✏️ Управление контентом</h1>
        </div>

        {/* Entity selector */}
        <div className="flex gap-2 mb-6">
          {(['wine', 'kitchen', 'bar'] as EntityType[]).map(entity => (
            <button
              key={entity}
              onClick={() => setSelectedEntity(entity)}
              className={`px-4 py-2 rounded-lg transition text-sm ${
                selectedEntity === entity ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {ENTITY_LABELS[entity]}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg transition text-sm ${
                activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Загрузка...</div>
        ) : (
          <>
            {/* Cards Tab */}
            {activeTab === 'cards' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Карточки ({cards.length})</h2>
                  <button
                    onClick={() => { setEditingCard(null); setShowCardModal(true); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                  >
                    + Добавить карточку
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map(card => (
                    <div key={card.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-xs">
                          {categories.find(c => c.id === card.categoryId)?.name || '—'}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setEditingCard(card); setShowCardModal(true); }} 
                            className="text-blue-400 hover:text-blue-300 text-sm"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => setCardToDelete(card.id)} 
                            className="text-red-400 hover:text-red-300 text-sm"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {card.imageUrl && (
                        <img src={card.imageUrl} alt="" className="w-full h-40 object-contain bg-gray-900 rounded-lg mb-2" />
                      )}
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {card.tags.map(tagId => (
                            <span key={tagId} className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-xs">
                              {tags.find(t => t.id === tagId)?.name || '—'}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 space-y-1">
                        {fields.map(field => (
                          card.fields[field.id] && (
                            <div key={field.id} className="text-sm">
                              <span className="text-gray-500">{field.name}: </span>
                              <span className="text-gray-200">{card.fields[field.id]}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {cards.length === 0 && <div className="text-center py-10 text-gray-500">Нет карточек</div>}
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Категории ({categories.length})</h2>
                  <button
                    onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                  >
                    + Добавить категорию
                  </button>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                      <span className="text-white">{cat.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="text-blue-400 hover:text-blue-300">✏️</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Теги ({tags.length})</h2>
                  <button
                    onClick={() => { setEditingTag(null); setShowTagModal(true); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                  >
                    + Добавить тег
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div key={tag.id} className="bg-gray-800/50 rounded-full px-4 py-2 border border-gray-700 flex items-center gap-2">
                      <span className="text-white text-sm">{tag.name}</span>
                      <button onClick={() => { setEditingTag(tag); setShowTagModal(true); }} className="text-blue-400 hover:text-blue-300 text-xs">✏️</button>
                      <button onClick={() => deleteTag(tag.id)} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fields Tab */}
            {activeTab === 'fields' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Поля ({fields.length})</h2>
                  <button
                    onClick={() => { setEditingField(null); setShowFieldModal(true); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                  >
                    + Добавить поле
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-6">{idx + 1}.</span>
                        <span className="text-white">{field.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingField(field); setShowFieldModal(true); }} className="text-blue-400 hover:text-blue-300">✏️</button>
                        <button onClick={() => deleteField(field.id)} className="text-red-400 hover:text-red-300">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <CardModal
          card={editingCard}
          categories={categories}
          tags={tags}
          fields={fields}
          onSave={saveCard}
          onClose={() => { setShowCardModal(false); setEditingCard(null); }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <SimpleModal
          title={editingCategory ? 'Редактировать категорию' : 'Новая категория'}
          fields={[{ key: 'name', label: 'Название', value: editingCategory?.name || '' }]}
          onSave={(data) => saveCategory({ name: data.name })}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        />
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <SimpleModal
          title={editingTag ? 'Редактировать тег' : 'Новый тег'}
          fields={[{ key: 'name', label: 'Название', value: editingTag?.name || '' }]}
          onSave={(data) => saveTag({ name: data.name })}
          onClose={() => { setShowTagModal(false); setEditingTag(null); }}
        />
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <SimpleModal
          title={editingField ? 'Редактировать поле' : 'Новое поле'}
          fields={[
            { key: 'name', label: 'Название поля', value: editingField?.name || '' },
            { key: 'order', label: 'Порядок', value: String(editingField?.order ?? fields.length + 1), type: 'number' },
          ]}
          onSave={(data) => saveField({ name: data.name, order: parseInt(data.order) || 0 })}
          onClose={() => { setShowFieldModal(false); setEditingField(null); }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {cardToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">🗑️ Удалить карточку?</h3>
            <p className="text-gray-300 mb-6">
              Вы уверены, что хотите удалить эту карточку? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteCard(cardToDelete)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                onClick={() => setCardToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Card Modal Component
const CardModal: React.FC<{
  card: Card | null;
  categories: Category[];
  tags: Tag[];
  fields: FieldDefinition[];
  onSave: (card: Partial<Card>) => void;
  onClose: () => void;
}> = ({ card, categories, tags, fields, onSave, onClose }) => {
  const [categoryId, setCategoryId] = useState(card?.categoryId || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags || []);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(card?.fields || {});
  const [imageUrl, setImageUrl] = useState(card?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      categoryId,
      tags: selectedTags,
      fields: fieldValues,
      imageUrl,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка размера (макс 1MB для Firestore)
    if (file.size > 1024 * 1024) {
      alert('Размер изображения не должен превышать 1MB');
      return;
    }
    
    setUploading(true);
    try {
      // Конвертируем в base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageUrl(base64);
        setUploading(false);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Ошибка при чтении файла');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка при загрузке изображения: ' + (error as Error).message);
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">
          {card ? 'Редактировать карточку' : 'Новая карточка'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Категория *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Теги</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id])}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedTags.includes(tag.id) ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-gray-400 block">Поля</label>
            {fields.map(field => (
              <div key={field.id}>
                <label className="text-xs text-gray-500 mb-1 block">{field.name}</label>
                <input
                  type="text"
                  value={fieldValues[field.id] || ''}
                  onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder={`Введите ${field.name.toLowerCase()}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Изображение</label>
            {imageUrl ? (
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Preview" className="w-full h-48 object-contain" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <div className="text-gray-400">Загрузка...</div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-2 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="text-xs text-gray-400">Нажмите для загрузки изображения</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              Сохранить
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Simple Modal Component
const SimpleModal: React.FC<{
  title: string;
  fields: { key: string; label: string; value: string; type?: string }[];
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
}> = ({ title, fields, onSave, onClose }) => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.key, f.value]))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-sm text-gray-400 mb-1 block">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={values[field.key] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                required
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              Сохранить
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminContentPage;
