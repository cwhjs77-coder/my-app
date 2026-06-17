import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJhzoFv-XS11lhx_jPDAQegW8OBDTIqb0",
  authDomain: "gyeongnam-network-platform.firebaseapp.com",
  projectId: "gyeongnam-network-platform",
  storageBucket: "gyeongnam-network-platform.firebasestorage.app",
  messagingSenderId: "742300349118",
  appId: "1:742300349118:web:6ea7313b176bcabc1564ef",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);