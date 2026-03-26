import React from "react";
import { useTranslation } from "react-i18next";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  variant?: "icon" | "button" | "compact";
  showLabel?: boolean;
  className?: string;
}

/**
 * LanguageSwitcher Component
 * Production-ready language selection component
 * Supports multiple display variants
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "icon",
  showLabel = true,
  className = "",
}) => {
  const { t } = useTranslation();
  const { language, setLanguage, isLoading } = useLanguage();

  const languages: Array<{ code: Language; label: string; emoji: string }> = [
    { code: "en", label: t("language.en"), emoji: "🇬🇧" },
    { code: "hi", label: t("language.hi"), emoji: "🇮🇳" },
  ];

  const currentLanguage = languages.find((l) => l.code === language);

  const handleLanguageChange = async (lang: Language) => {
    if (lang !== language) {
      await setLanguage(lang);
    }
  };

  if (variant === "compact") {
    return (
      <div className={`flex gap-2 items-center ${className}`}>
        {languages.map((lang) => (
          <Button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            variant={language === lang.code ? "default" : "outline"}
            size="sm"
            className="text-xs font-medium"
            disabled={isLoading}
          >
            {lang.emoji} {lang.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          className={`relative ${className}`}
          disabled={isLoading}
        >
          <Globe className="w-5 h-5" />
          {variant === "button" && showLabel && (
            <span className="ml-2 text-sm font-medium">{currentLanguage?.emoji}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t("language.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="cursor-pointer flex items-center gap-3"
          >
            <span className="text-lg">{lang.emoji}</span>
            <span className="flex-1">{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-xs font-semibold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
