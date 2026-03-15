import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { api, setAuth, clearAuth, getAuth, USER_DATA_KEY } from "@/services/api";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  phone: string;
  name?: string;
  language?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; message?: string; onboardingCompleted?: boolean }>;
  sendOTP: (phone: string) => Promise<{ success: boolean; message?: string }>;
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

    api.auth
      .getProfile()
      .then(async (result) => {
        if (result.success && result.user) {
          setUser(result.user as User);
          setAuth(result.user as Record<string, unknown>);
          if ((result.user as User).language && i18n.resolvedLanguage !== (result.user as User).language) {
            void i18n.changeLanguage((result.user as User).language as string);
          }

          const completed = await fetchOnboardingStatus();
          setOnboardingCompleted(completed);
        } else {
          clearAuth();
          setUser(null);
          setOnboardingCompleted(false);
        }
      })
      .finally(() => setLoading(false));
  }, [i18n]);

  const sendOTP = async (phone: string) => {
    try {
      const result = await api.auth.sendOTP(phone);
      return { success: result.success, message: result.message };
    } catch (error) {
      return { success: false, message: "Failed to send OTP" };
    }
  };

  const login = async (phone: string, otp: string) => {
    try {
      const result = await api.auth.verifyOTP(phone, otp);
      if (result.success && result.user) {
        setAuth(result.user);
        setUser(result.user);
        if (result.user.language && i18n.resolvedLanguage !== result.user.language) {
          void i18n.changeLanguage(result.user.language);
        }

        const completed = await fetchOnboardingStatus();
        setOnboardingCompleted(completed);

        return { success: true, onboardingCompleted: completed };
      }
      return { success: false, message: result.message || "Verification failed" };
    } catch (error) {
      return { success: false, message: "Login failed" };
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
        sendOTP,
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
