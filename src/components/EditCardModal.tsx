import React, { useState } from 'react';
import { Card, Category, Tag, FieldDefinition } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ImageCropper from './ImageCropper';

interface EditCardModalProps {
  card: Card;
  categories: Category[];
  tags: Tag[];
  fields: FieldDefinition[];
  onClose: () => void;
  onSave: () => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ card, categories, tags, fields, onClose, onSave }) => {
  const [categoryId, setCategoryId] = useState(card.categoryId);
  const [selectedTags, setSelectedTags] = useState<string[]>(card.tags || []);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(card.fields || {});
  const [imageUrl, setImageUrl] = useState(card.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setUploading(true);
    setCropImageSrc(null);
    
    try {
      const { compressAndConvertToBase64 } = await import('../utils/imageCompression');
      const base64 = await compressAndConvertToBase64(croppedFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
      });
      setImageUrl(base64);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Ошибка при обработке изображения: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'cards', card.id), {
        categoryId,
        tags: selectedTags,
        fields: fieldValues,
        imageUrl,
        updatedAt: Date.now(),
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Ошибка при сохранении: ' + (error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 my-8">
        <h2 className="text-xl font-bold text-white mb-6">Редактировать карточку</h2>
        
        <div className="space-y-4">
          {/* Category */}
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

          {/* Tags */}
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

          {/* Fields */}
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

          {/* Image */}
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Сохранить
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default EditCardModal;
