import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const readEnv = (key: string) => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" ? value.trim() : value;
};

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseClientReady = missingKeys.length === 0;

export const getFirebaseClientConfigError = () => {
  if (isFirebaseClientReady) return "";
  return `Firebase config is incomplete. Missing: ${missingKeys.join(", ")}. Set VITE_FIREBASE_* env vars.`;
};

if (!isFirebaseClientReady) {
  // Keep startup non-fatal in development and surface configuration issues via console.
  console.warn(getFirebaseClientConfigError());
}

const firebaseApp = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export default firebaseApp;