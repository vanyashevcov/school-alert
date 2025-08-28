
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Firestore persistence is not available in this browser.');
    }
  });


export { app, auth, db };
