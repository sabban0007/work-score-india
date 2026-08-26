import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBS1_AO3dxqy83-p5zRjGFEIvi-SyKaaxI",
  authDomain: "work-score-india-web.firebaseapp.com",
  projectId: "work-score-india-web",
  storageBucket: "work-score-india-web.firebasestorage.app",
  messagingSenderId: "60459562494",
  appId: "1:60459562494:web:be673994288c8c3d403caf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const authInstance = getAuth(app);
