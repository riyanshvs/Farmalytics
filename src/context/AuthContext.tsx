import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { api, setAuth, clearAuth, getAuth, USER_DATA_KEY } from "@/services/api";
import { useTranslation } from "react-i18next";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { firebaseAuth, getFirebaseClientConfigError, isFirebaseClientReady } from "@/lib/firebase";

const ONBOARDING_COMPLETED_KEY = "onboardingCompleted";
const AUTH_INIT_TIMEOUT_MS = 8000;
const AUTH_REQUEST_TIMEOUT_MS = 12000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) => {
  let timeoutId: number | undefined;

  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

const parseJsonArray = (value: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getLocalOnboardingStatus = () => {
  const explicitFlag = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  if (explicitFlag) return true;

  const locationRaw = localStorage.getItem("userLocation");
  const farmSizeRaw = localStorage.getItem("farmSize");
  const crops = parseJsonArray(localStorage.getItem("selectedCrops"));
  const distributions = parseJsonArray(localStorage.getItem("farmDistributions"));

  let hasLocation = false;
  if (locationRaw) {
    try {
      const location = JSON.parse(locationRaw) as { state?: string; district?: string };
      hasLocation = Boolean(location?.state && location?.district);
    } catch {
      hasLocation = false;
    }
  }

  const farmSize = Number(farmSizeRaw);
  const hasFarmSize = Number.isFinite(farmSize) && farmSize > 0;
  const hasCrops = crops.length > 0;
  const hasDistributions =
    distributions.length > 0 &&
    distributions.every((item) => {
      const record = item as { name?: string; area?: number };
      return Boolean(record?.name) && typeof record?.area === "number" && record.area > 0;
    });

  return hasLocation && hasFarmSize && hasCrops && hasDistributions;
};

const mapFirebaseAuthError = (error: unknown, fallback: string) => {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in.";
    case "auth/weak-password":
      return "Password is too weak. Use a stronger password.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    default:
      return fallback;
  }
};

interface User {
  id: string;
  email: string;
  name?: string;
  language?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; onboardingCompleted?: boolean }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string; onboardingCompleted?: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: { name?: string; language?: string }) => Promise<void>;
  onboardingCompleted: boolean;
  markOnboardingComplete: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const initializedRef = useRef(false);

  const applyFirebaseFallbackUser = useCallback((firebaseUser: { uid: string; email: string | null; displayName: string | null; emailVerified: boolean }) => {
    const { user: cachedUser } = getAuth();
    const fallbackUser = {
      id: (cachedUser as User | null)?.id || firebaseUser.uid,
      email: (cachedUser as User | null)?.email || firebaseUser.email || "",
      name: (cachedUser as User | null)?.name || firebaseUser.displayName || "",
      language: (cachedUser as User | null)?.language || "en",
      emailVerified: firebaseUser.emailVerified,
    };

    setUser(fallbackUser);
    setAuth(fallbackUser as Record<string, unknown>);
    if (fallbackUser.name) {
      localStorage.setItem("userName", fallbackUser.name);
    }

    if (fallbackUser.language && i18n.resolvedLanguage !== fallbackUser.language) {
      void i18n.changeLanguage(fallbackUser.language);
    }

    const completed = getLocalOnboardingStatus();
    setOnboardingCompleted(completed);
    return completed;
  }, [i18n]);

  const fetchOnboardingStatus = useCallback(async () => {
    return getLocalOnboardingStatus();
  }, []);

  const syncProfile = useCallback(async () => {
    const result = await api.auth.getProfile();
    if (!result.success || !result.user) {
      const firebaseUser = firebaseAuth.currentUser;
      if (!firebaseUser) {
        clearAuth();
        setUser(null);
        setOnboardingCompleted(false);
        return { success: false as const, message: result.message };
      }

      const completed = applyFirebaseFallbackUser(firebaseUser);
      setOnboardingCompleted(completed);
      return { success: true as const, onboardingCompleted: completed };
    }

    setUser(result.user as User);
    setAuth(result.user as Record<string, unknown>);
    if ((result.user as User).name) {
      localStorage.setItem("userName", (result.user as User).name as string);
    }

    const userLanguage = (result.user as User).language;
    if (userLanguage && i18n.resolvedLanguage !== userLanguage) {
      void i18n.changeLanguage(userLanguage);
    }

    const completed = await fetchOnboardingStatus();
    setOnboardingCompleted(completed);

    return { success: true as const, onboardingCompleted: completed };
  }, [applyFirebaseFallbackUser, fetchOnboardingStatus, i18n]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    if (!isFirebaseClientReady) {
      clearAuth();
      setUser(null);
      setOnboardingCompleted(false);
      setLoading(false);
      return;
    }

    const initTimeout = window.setTimeout(() => {
      console.warn("Auth initialization timed out. Continuing without blocking UI.");
      setLoading(false);
    }, AUTH_INIT_TIMEOUT_MS);

    const { user: cachedUser } = getAuth();
    if (cachedUser) {
      setUser(cachedUser as User);
      if ((cachedUser as User).language && i18n.resolvedLanguage !== (cachedUser as User).language) {
        void i18n.changeLanguage((cachedUser as User).language as string);
      }
    }

    const unsub = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      window.clearTimeout(initTimeout);

      if (!firebaseUser) {
        clearAuth();
        setUser(null);
        setOnboardingCompleted(false);
        setLoading(false);
        return;
      }

      const { user: cachedUser } = getAuth();
      const immediateUser = {
        id: (cachedUser as User | null)?.id || firebaseUser.uid,
        email: (cachedUser as User | null)?.email || firebaseUser.email || "",
        name: (cachedUser as User | null)?.name || firebaseUser.displayName || "",
        language: (cachedUser as User | null)?.language || i18n.resolvedLanguage || "en",
        emailVerified: firebaseUser.emailVerified,
      };

      setUser(immediateUser);
      setAuth(immediateUser as Record<string, unknown>);
      setOnboardingCompleted(getLocalOnboardingStatus());

      if (immediateUser.language && i18n.resolvedLanguage !== immediateUser.language) {
        void i18n.changeLanguage(immediateUser.language);
      }

      // Do not block first paint on backend profile fetch.
      setLoading(false);

      void syncProfile().catch((error) => {
        console.error("Background profile sync failed:", error);
      });
    });

    return () => {
      window.clearTimeout(initTimeout);
      unsub();
    };
  }, [i18n, syncProfile]);

  const register = async (email: string, password: string, name?: string) => {
    if (!isFirebaseClientReady) {
      return { success: false, message: getFirebaseClientConfigError() };
    }

    try {
      const credential = await withTimeout(
        createUserWithEmailAndPassword(firebaseAuth, email.trim(), password),
        AUTH_REQUEST_TIMEOUT_MS,
        "auth/request-timeout"
      );
      if (name?.trim()) {
        await updateFirebaseProfile(credential.user, { displayName: name.trim() });
      }

      const synced = await syncProfile();
      if (!synced.success) {
        const completed = applyFirebaseFallbackUser(credential.user);
        return { success: true, onboardingCompleted: completed };
      }
      if (name?.trim()) {
        await updateProfile({ name: name.trim() });
      }
      return synced.success
        ? { success: true, onboardingCompleted: synced.onboardingCompleted }
        : { success: false, message: synced.message || "Registration failed" };
    } catch (error) {
      if (error instanceof Error && error.message === "auth/request-timeout") {
        return {
          success: false,
          message: "Registration request timed out. Please check your internet and try again.",
        };
      }
      return { success: false, message: mapFirebaseAuthError(error, "Registration failed") };
    }
  };

  const login = async (email: string, password: string) => {
    if (!isFirebaseClientReady) {
      return { success: false, message: getFirebaseClientConfigError() };
    }

    try {
      const credential = await withTimeout(
        signInWithEmailAndPassword(firebaseAuth, email.trim(), password),
        AUTH_REQUEST_TIMEOUT_MS,
        "auth/request-timeout"
      );
      const synced = await syncProfile();
      if (!synced.success) {
        const completed = applyFirebaseFallbackUser(credential.user);
        return { success: true, onboardingCompleted: completed };
      }
      return synced.success
        ? { success: true, onboardingCompleted: synced.onboardingCompleted }
        : { success: false, message: synced.message || "Login failed" };
    } catch (error) {
      if (error instanceof Error && error.message === "auth/request-timeout") {
        return {
          success: false,
          message: "Login request timed out. Please check your internet and try again.",
        };
      }
      return { success: false, message: mapFirebaseAuthError(error, "Login failed") };
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!isFirebaseClientReady) {
      return { success: false, message: getFirebaseClientConfigError() };
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      return {
        success: false,
        message: mapFirebaseAuthError(error, "Failed to send password reset email"),
      };
    }
  };

  const updateProfile = async (data: { name?: string; language?: string }) => {
    try {
      const result = await api.auth.updateProfile(data);
      if (result.user) {
        setUser(result.user);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.user));
        if (data.language && i18n.resolvedLanguage !== data.language) {
          void i18n.changeLanguage(data.language);
        }
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const logout = () => {
    void api.auth.logout();
    void signOut(firebaseAuth);
    clearAuth();
    setUser(null);
    setOnboardingCompleted(false);
  };

  const markOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setOnboardingCompleted(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        sendPasswordReset,
        updateProfile,
        onboardingCompleted,
        markOnboardingComplete,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
