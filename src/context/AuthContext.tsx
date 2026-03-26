import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
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
import { firebaseAuth } from "@/lib/firebase";

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

  const syncProfile = async () => {
    const result = await api.auth.getProfile();
    if (!result.success || !result.user) {
      clearAuth();
      setUser(null);
      setOnboardingCompleted(false);
      return { success: false as const, message: result.message };
    }

    setUser(result.user as User);
    setAuth(result.user as Record<string, unknown>);

    const userLanguage = (result.user as User).language;
    if (userLanguage && i18n.resolvedLanguage !== userLanguage) {
      void i18n.changeLanguage(userLanguage);
    }

    const completed = await fetchOnboardingStatus();
    setOnboardingCompleted(completed);

    return { success: true as const, onboardingCompleted: completed };
  };

  const isFarmOnboardingComplete = (farm: unknown): boolean => {
    if (!farm || typeof farm !== "object") return false;

    const farmRecord = farm as {
      location?: { state?: string; district?: string };
      farmSize?: number;
      selectedCrops?: string[];
      distributions?: Array<{ name?: string; area?: number }>;
    };

    const hasLocation = !!farmRecord.location?.state && !!farmRecord.location?.district;
    const hasFarmSize = typeof farmRecord.farmSize === "number" && farmRecord.farmSize > 0;
    const hasCrops = Array.isArray(farmRecord.selectedCrops) && farmRecord.selectedCrops.length > 0;
    const hasDistributions =
      Array.isArray(farmRecord.distributions) &&
      farmRecord.distributions.length > 0 &&
      farmRecord.distributions.every(
        (item) => !!item?.name && typeof item.area === "number" && item.area > 0
      );

    return hasLocation && hasFarmSize && hasCrops && hasDistributions;
  };

  const fetchOnboardingStatus = async () => {
    try {
      const farmResponse = await api.farm.get();
      return isFarmOnboardingComplete(farmResponse?.farm);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const { user: cachedUser } = getAuth();
    if (cachedUser) {
      setUser(cachedUser as User);
      if ((cachedUser as User).language && i18n.resolvedLanguage !== (cachedUser as User).language) {
        void i18n.changeLanguage((cachedUser as User).language as string);
      }
    }

    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearAuth();
        setUser(null);
        setOnboardingCompleted(false);
        setLoading(false);
        return;
      }

      await syncProfile();
      setLoading(false);
    });

    return () => unsub();
  }, [i18n]);

  const register = async (email: string, password: string, name?: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (name?.trim()) {
        await updateFirebaseProfile(credential.user, { displayName: name.trim() });
      }

      const synced = await syncProfile();
      if (name?.trim()) {
        await updateProfile({ name: name.trim() });
      }
      return synced.success
        ? { success: true, onboardingCompleted: synced.onboardingCompleted }
        : { success: false, message: synced.message || "Registration failed" };
    } catch {
      return { success: false, message: "Registration failed" };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const synced = await syncProfile();
      return synced.success
        ? { success: true, onboardingCompleted: synced.onboardingCompleted }
        : { success: false, message: synced.message || "Login failed" };
    } catch {
      return { success: false, message: "Login failed" };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      return { success: true, message: "Password reset email sent" };
    } catch {
      return { success: false, message: "Failed to send password reset email" };
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
