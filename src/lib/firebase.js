import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDDvGjF1E38vQWqXZbvCO7Sj3ZXBn-B58o',
  authDomain: 'trainingapp-62796.firebaseapp.com',
  projectId: 'trainingapp-62796',
  storageBucket: 'trainingapp-62796.firebasestorage.app',
  messagingSenderId: '714529736826',
  appId: '1:714529736826:web:bca04ce920679a9b5f53c3',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
