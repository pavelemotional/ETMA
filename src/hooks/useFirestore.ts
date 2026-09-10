import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Card, Category, Tag, FieldDefinition, EntityType, StudyProgress } from '../types';

// Cards
export const useCards = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ['cards', entityType],
    queryFn: async () => {
      const q = entityType 
        ? query(collection(db, 'cards'), where('entityType', '==', entityType))
        : collection(db, 'cards');
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map(d => {
        const data = d.data();
        console.log(`Card ${d.id} from Firestore:`, {
          hasImageUrl: !!data.imageUrl,
          imageUrlLength: data.imageUrl?.length || 0,
          imageUrlPreview: data.imageUrl ? `${data.imageUrl.substring(0, 50)}...` : 'undefined'
        });
        return { id: d.id, ...data } as Card;
      });
      return cards;
    },
  });
};

export const useCardMutations = () => {
  const queryClient = useQueryClient();

  const createCard = useMutation({
    mutationFn: async (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, 'cards'), {
        ...card,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { id: docRef.id, ...card };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Card> & { id: string }) => {
      await updateDoc(doc(db, 'cards', id), { ...data, updatedAt: Date.now() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'cards', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  return { createCard, updateCard, deleteCard };
};

// Categories
export const useCategories = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ['categories', entityType],
    queryFn: async () => {
      const q = entityType
        ? query(collection(db, 'categories'), where('entityType', '==', entityType))
        : collection(db, 'categories');
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    },
  });
};

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (category: Omit<Category, 'id'>) => {
      const docRef = await addDoc(collection(db, 'categories'), category);
      return { id: docRef.id, ...category };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Category> & { id: string }) => {
      await updateDoc(doc(db, 'categories', id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'categories', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return { createCategory, updateCategory, deleteCategory };
};

// Tags
export const useTags = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ['tags', entityType],
    queryFn: async () => {
      const q = entityType
        ? query(collection(db, 'tags'), where('entityType', '==', entityType))
        : collection(db, 'tags');
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
    },
  });
};

export const useTagMutations = () => {
  const queryClient = useQueryClient();

  const createTag = useMutation({
    mutationFn: async (tag: Omit<Tag, 'id'>) => {
      const docRef = await addDoc(collection(db, 'tags'), tag);
      return { id: docRef.id, ...tag };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Tag> & { id: string }) => {
      await updateDoc(doc(db, 'tags', id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'tags', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  return { createTag, updateTag, deleteTag };
};

// Field Definitions
export const useFieldDefinitions = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ['fieldDefinitions', entityType],
    queryFn: async () => {
      const q = entityType
        ? query(collection(db, 'fieldDefinitions'), where('entityType', '==', entityType))
        : collection(db, 'fieldDefinitions');
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as FieldDefinition))
        .sort((a, b) => a.order - b.order);
    },
  });
};

export const useFieldDefinitionMutations = () => {
  const queryClient = useQueryClient();

  const createFieldDefinition = useMutation({
    mutationFn: async (field: Omit<FieldDefinition, 'id'>) => {
      const docRef = await addDoc(collection(db, 'fieldDefinitions'), field);
      return { id: docRef.id, ...field };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldDefinitions'] });
    },
  });

  const updateFieldDefinition = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FieldDefinition> & { id: string }) => {
      await updateDoc(doc(db, 'fieldDefinitions', id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldDefinitions'] });
    },
  });

  const deleteFieldDefinition = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'fieldDefinitions', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldDefinitions'] });
    },
  });

  return { createFieldDefinition, updateFieldDefinition, deleteFieldDefinition };
};

// Study Progress
export const useStudyProgress = (userId: string, entityType?: EntityType) => {
  return useQuery({
    queryKey: ['progress', userId, entityType],
    queryFn: async () => {
      const q = entityType
        ? query(
            collection(db, 'progress'),
            where('userId', '==', userId),
            where('entityType', '==', entityType)
          )
        : query(collection(db, 'progress'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const progress: Record<string, StudyProgress> = {};
      snapshot.docs.forEach(d => {
        progress[d.id] = { id: d.id, ...d.data() } as StudyProgress;
      });
      return progress;
    },
    enabled: !!userId,
  });
};
