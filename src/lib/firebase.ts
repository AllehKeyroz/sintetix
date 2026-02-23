import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAJAl3VE7F5oIjNCqLjCgrXf1WOtcZ6124",
    authDomain: "sintetix-agency.firebaseapp.com",
    projectId: "sintetix-agency",
    storageBucket: "sintetix-agency.firebasestorage.app",
    messagingSenderId: "1035394752704",
    appId: "1:1035394752704:web:74a9d694c6ec56b7160d25",
    measurementId: "G-ZQNDF8MDYZ"
};

// Initialize Firebase (Singleton pattern for Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
