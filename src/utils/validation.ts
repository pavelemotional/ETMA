export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FirestoreError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'FirestoreError';
  }
}

export const validateRequired = (value: unknown, fieldName: string): void => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new ValidationError(`Поле "${fieldName}" обязательно для заполнения`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Некорректный email адрес');
  }
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): void => {
  if (value.length < minLength) {
    throw new ValidationError(
      `Поле "${fieldName}" должно содержать минимум ${minLength} символов`
    );
  }
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): void => {
  if (value.length > maxLength) {
    throw new ValidationError(
      `Поле "${fieldName}" должно содержать максимум ${maxLength} символов`
    );
  }
};

export const validateCard = (card: { categoryId: string; fields: Record<string, string> }): void => {
  validateRequired(card.categoryId, 'Категория');
  
  if (!card.fields || Object.keys(card.fields).length === 0) {
    throw new ValidationError('Карточка должна содержать хотя бы одно поле');
  }
};

export const validateCategory = (category: { name: string }): void => {
  validateRequired(category.name, 'Название категории');
  validateMinLength(category.name, 2, 'Название категории');
  validateMaxLength(category.name, 50, 'Название категории');
};

export const validateTag = (tag: { name: string }): void => {
  validateRequired(tag.name, 'Название тега');
  validateMinLength(tag.name, 2, 'Название тега');
  validateMaxLength(tag.name, 30, 'Название тега');
};

export const validateFieldDefinition = (field: { name: string; order: number }): void => {
  validateRequired(field.name, 'Название поля');
  validateMinLength(field.name, 2, 'Название поля');
  validateMaxLength(field.name, 50, 'Название поля');
  
  if (field.order < 0) {
    throw new ValidationError('Порядок поля не может быть отрицательным');
  }
};
