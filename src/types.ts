export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  entityType: EntityType;
}

export interface Tag {
  id: string;
  name: string;
  entityType: EntityType;
}

export type EntityType = 'wine' | 'kitchen' | 'bar';

export interface Card {
  id: string;
  entityType: EntityType;
  categoryId: string;
  tags: string[];
  fields: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface StudyProgress {
  id: string;
  userId: string;
  cardId: string;
  entityType: EntityType;
  timesShown: number;
  timesCorrect: number;
  lastShown: number;
  isLearned: boolean;
}

export interface FieldDefinition {
  id: string;
  name: string;
  entityType: EntityType;
  order: number;
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  wine: 'Вино',
  kitchen: 'Кухня',
  bar: 'Бар'
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  wine: '🍷',
  kitchen: '🍽️',
  bar: '🍸'
};
