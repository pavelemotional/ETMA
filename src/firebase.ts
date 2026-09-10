import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAgBodT-NATd1MCxcZQ3Em-R1FTWTUjcZU",
  authDomain: "etmadatabase.firebaseapp.com",
  projectId: "etmadatabase",
  storageBucket: "etmadatabase.firebasestorage.app",
  messagingSenderId: "323407842441",
  appId: "1:323407842441:web:e53f07ffe4d9ec9a020a58"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
