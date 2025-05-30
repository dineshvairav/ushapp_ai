
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore"; // Example for Firestore
// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Example for Storage

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCnmEM8R74x6Cum5-R9jzjwmlnGoRM1HG8",
  authDomain: "ushapp-af453.firebaseapp.com",
  databaseURL: "https://ushapp-af453-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ushapp-af453",
  storageBucket: "ushapp-af453.firebasestorage.app",
  messagingSenderId: "86151688614",
  appId: "1:86151688614:web:a9de9676de466f66889f67"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
// let firestore: Firestore; // Example for Firestore
// let storage: FirebaseStorage; // Example for Storage

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
// firestore = getFirestore(app); // Example for Firestore
// storage = getStorage(app); // Example for Storage

export { app, auth }; // Export other services as needed, e.g., firestore, storage
export default app;
