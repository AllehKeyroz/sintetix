import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBIs-MJOiyX0f0m4M6kfsuhOeWF0796Bw",
  authDomain: "studio-1675308976-5ff25.firebaseapp.com",
  projectId: "studio-1675308976-5ff25",
  storageBucket: "studio-1675308976-5ff25.firebasestorage.app",
  messagingSenderId: "137925053352",
  appId: "1:137925053352:web:9d5f21d251a28ee528eb9d"
};

// Initialize Firebase (SSR safe)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
