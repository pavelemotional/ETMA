# Restaurant Cards - Сервис для изучения меню и винной карты

## 🍷 Описание

Сервис для изучения карточек с вином, блюдами кухни и барной картой. Предназначен для обучения персонала ресторана.

## ✨ Функционал

### Для пользователей:
- 🔐 Вход по паролю
- 🃏 Изучение карточек в режиме просмотра и изучения
- 📊 Личная статистика прогресса
- 🏷️ Фильтрация по категориям и тегам

### Для администраторов:
- ✏️ Управление контентом (карточки, категории, теги, поля)
- 👥 Управление пользователями (создание, удаление)
- 📈 Обширная аналитика по всем пользователям

## 🏗️ Структура данных

### 3 сущности:
1. **Вино** 🍷 — категории: игристое, белое, красное, розе, оранж
2. **Кухня** 🍽️ — категории: закуски, салаты, супы, горячее, десерты
3. **Бар** 🍸 — категории: кофе, коктейли, крепкий алкоголь

### Поля (настраиваемые):
Каждая сущность имеет свои настраиваемые поля. Например для вина:
- Название, Регион, Виноград, Год, Описание, Цена

### Теги:
Настраиваемые теги для каждой сущности. Например для вина:
- Бутылочное, Бокальное

## 🚀 Настройка Firebase

### 1. Создайте проект в Firebase Console
1. Перейдите на [console.firebase.google.com](https://console.firebase.google.com)
2. Создайте новый проект
3. В настройках проекта создайте Web-приложение
4. Скопируйте конфигурацию Firebase

### 2. Настройте Firestore Database
1. В Firebase Console перейдите в Firestore Database
2. Создайте базу данных (выберите режим production)
3. Настройте правила безопасности (см. ниже)

### 3. Настройте переменные окружения
Создайте файл `.env` в корне проекта:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Создайте первого администратора
В Firestore Console создайте документ в коллекции `users`:
```json
{
  "username": "admin",
  "password": "your_secure_password",
  "isAdmin": true,
  "createdAt": 1234567890
}
```

## 📋 Правила Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Разрешить чтение и запись для всех (т.к. авторизация через свой механизм)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ **Внимание**: Эти правила подходят только для внутреннего использования. Для публичного доступа рекомендуется настроить более строгие правила.

## 📦 Структура коллекций Firestore

### users
```json
{
  "username": "string",
  "password": "string",
  "isAdmin": boolean,
  "createdAt": number
}
```

### categories
```json
{
  "name": "string",
  "entityType": "wine" | "kitchen" | "bar"
}
```

### tags
```json
{
  "name": "string",
  "entityType": "wine" | "kitchen" | "bar"
}
```

### fieldDefinitions
```json
{
  "name": "string",
  "entityType": "wine" | "kitchen" | "bar",
  "order": number
}
```

### cards
```json
{
  "entityType": "wine" | "kitchen" | "bar",
  "categoryId": "string (id категории)",
  "tags": ["string (id тегов)"],
  "fields": { "fieldId": "value" },
  "createdAt": number,
  "updatedAt": number
}
```

### progress
```json
{
  "id": "userId_cardId",
  "userId": "string",
  "cardId": "string",
  "entityType": "wine" | "kitchen" | "bar",
  "timesShown": number,
  "timesCorrect": number,
  "lastShown": number,
  "isLearned": boolean
}
```

## 🏠 Деплой на GitHub Pages

```bash
npm run build
# Загрузите содержимое папки dist/ в ветку gh-pages
```

Или используйте GitHub Actions для автоматического деплоя.

## 🛠️ Разработка

```bash
npm install
npm run dev
```

## 📝 Лицензия

MIT
