import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Prefer Vite environment variables. If they are not set, fall back to any
// existing hardcoded values (useful for local testing). Do NOT commit secrets.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase only once (prevents HMR / duplicate-app errors)
// If API key is missing, skip initialization to avoid the `auth/invalid-api-key` error
const apiKey = firebaseConfig.apiKey;
let app: any = null;
let auth: any = null;
let db: any = null;

if (!apiKey) {
  console.warn(
    "Firebase not initialized: VITE_FIREBASE_API_KEY is missing.\n" +
      "Using demo mode - data will not be saved to Firebase."
  );
} else {
  app = !getApps().length ? initializeApp(firebaseConfig as any) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export default app;
