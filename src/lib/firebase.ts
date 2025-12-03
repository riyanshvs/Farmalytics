import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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

if (!apiKey) {
  console.error(
    "Firebase not initialized: VITE_FIREBASE_API_KEY is missing.\n" +
      "Please add your Firebase web config to .env and restart the dev server."
  );
  // leave app and auth as null — callers should check
} else {
  app = !getApps().length ? initializeApp(firebaseConfig as any) : getApp();
  auth = getAuth(app);
}

export { auth };
export default app;
