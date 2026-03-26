import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAw8BYM2UgZMbgiitW9bzJ36AHUbvaiMUA",
  authDomain: "melodymix-34bc9.firebaseapp.com",
  projectId: "melodymix-34bc9",
  storageBucket: "melodymix-34bc9.firebasestorage.app",
  messagingSenderId: "873864985300",
  appId: "1:873864985300:web:6ca791cfd81ae8b1139941",
  measurementId: "G-5QC40JJN9E"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
