import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";
import { translateService } from "@/services/translateService";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
  translate: (text: string, targetLanguage?: Language) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(false);
  const initializedRef = useRef(false);

  // Initialize language on mount
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const savedLanguage = localStorage.getItem("preferredLanguage") as Language | null;
    const initialLanguage = savedLanguage || "en";

    setLanguageState((prev) => (prev === initialLanguage ? prev : initialLanguage));
    if (i18n.resolvedLanguage !== initialLanguage) {
      void i18n.changeLanguage(initialLanguage);
    }
  }, [i18n]);

  const setLanguage = async (lang: Language) => {
    try {
      // Validate language
      if (!["en", "hi"].includes(lang)) {
        throw new Error("Unsupported language");
      }

      if (lang === language && i18n.resolvedLanguage === lang) {
        return;
      }

      setIsLoading(true);

      // Update state first
      setLanguageState((prev) => (prev === lang ? prev : lang));

      // Save preferences to localStorage (multiple keys for compatibility)
      localStorage.setItem("preferredLanguage", lang);
      localStorage.setItem("language", lang);
      localStorage.setItem("i18nextLng", lang);  // For i18next detector

      // Change language in i18n
      if (i18n.resolvedLanguage !== lang) {
        await i18n.changeLanguage(lang);
      }

      // Log language change
      console.log(`📍 Language changed to: ${lang === "en" ? "English" : "हिंदी (Hindi)"}`);
    } catch (error) {
      console.error("Error changing language:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Translate using Google Translate service
  const translate = async (text: string, targetLanguage?: Language) => {
    const target = targetLanguage || language;
    return translateService.translate(text, target, "en");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
