import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhf6qxif7UGEZ0dmPO8MbL1Y0MQ-j823k",
  authDomain: "myai-ffa98.firebaseapp.com",
  projectId: "myai-ffa98",
  storageBucket: "myai-ffa98.firebasestorage.app",
  messagingSenderId: "785895999187",
  appId: "1:785895999187:web:4d8a71877c05ce38117626"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

