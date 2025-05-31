
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore"; // Example for Firestore
// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Example for Storage

// Your web app's Firebase configuration
// Values are now loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
// let firestore: Firestore | undefined; // Example for Firestore
// let storage: FirebaseStorage | undefined; // Example for Storage

// Check if essential Firebase config variables are present and appear valid
const essentialConfigIsValid = 
  firebaseConfig.apiKey && typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.authDomain && typeof firebaseConfig.authDomain === 'string' && firebaseConfig.authDomain.trim() !== '' &&
  firebaseConfig.projectId && typeof firebaseConfig.projectId === 'string' && firebaseConfig.projectId.trim() !== '';

if (essentialConfigIsValid) {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase: Error during initializeApp(). Check your Firebase config environment variables.", error);
      // app remains undefined
    }
  } else {
    app = getApps()[0]!;
  }

  if (app) {
    try {
      auth = getAuth(app);
    } catch (error) {
      console.error("Firebase: Error during getAuth().", error);
      // auth remains undefined
    }
    // try { // Example for Firestore
    //   firestore = getFirestore(app);
    // } catch (error) {
    //   console.error("Firebase: Error during getFirestore().", error);
    // }
    // try { // Example for Storage
    //   storage = getStorage(app);
    // } catch (error) {
    //   console.error("Firebase: Error during getStorage().", error);
    // }
  }
} else {
  console.warn(
    'Firebase essential configuration (apiKey, authDomain, projectId) is missing or invalid. ' +
    'Firebase SDK will not be initialized. ' +
    'Ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are correctly set in your build environment.'
  );
}

export { app, auth }; // Export other services as needed, e.g., firestore, storage
// Note: `app` could be undefined if initialization failed.
// Consumers should primarily check for the specific service they need (e.g., `auth`).
