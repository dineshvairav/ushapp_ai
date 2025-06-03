
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database"; // Added

// Your web app's Firebase configuration
// Values are hardcoded here as per the revert request.
const firebaseConfig = {
  apiKey: "AIzaSyCnmEM8R74x6Cum5-R9jzjwmlnGoRM1HG8",
  authDomain: "ushapp-af453.firebaseapp.com",
  databaseURL: "https://ushapp-af453-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ushapp-af453",
  storageBucket: "ushapp-af453.appspot.com",
  messagingSenderId: "86151688614",
  appId: "1:86151688614:web:a9de9676de466f66889f67"
};

let app: FirebaseApp;
let auth: Auth;
let rtdb: Database; // Added

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
rtdb = getDatabase(app); // Initialize Realtime Database

export { app, auth, rtdb }; // Export rtdb
