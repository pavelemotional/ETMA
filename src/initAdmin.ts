import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const ensureAdminExists = async () => {
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
      console.log('Admin already exists');
    }
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
  }
};
