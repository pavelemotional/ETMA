import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const ADMIN_INITIALIZED_KEY = 'admin_initialized';

export const ensureAdminExists = async () => {
  // Проверяем, был ли уже создан админ
  const alreadyInitialized = localStorage.getItem(ADMIN_INITIALIZED_KEY);
  if (alreadyInitialized === 'true') {
    console.log('Admin initialization already completed');
    return;
  }

  try {
    const q = query(collection(db, 'users'), where('isAdmin', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No admin found, creating default admin...');
      await addDoc(collection(db, 'users'), {
        username: 'admin',
        password: 'yeyeye',
        isAdmin: true,
        createdAt: Date.now(),
      });
      console.log('Admin created successfully! Username: admin, Password: yeyeye');
    } else {
      console.log('Admin already exists in database');
    }
    
    // Устанавливаем флаг, что инициализация завершена
    localStorage.setItem(ADMIN_INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
  }
};
