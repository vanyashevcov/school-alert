
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "school-hub-display",
  "appId": "1:702129583188:web:f14ddcd55332783df0a9c1",
  "storageBucket": "school-hub-display.firebasestorage.app",
  "apiKey": "AIzaSyDuVBk7Npa2hKJlVyupkT8dmmKKJcy0ECQ",
  "authDomain": "school-hub-display.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "702129583188"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
