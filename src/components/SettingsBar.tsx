import React from "react";
import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import useTheme from "@/lib/useTheme";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface SettingsBarProps {
  className?: string;
}

/**
 * SettingsBar Component
 * Combines language switcher and theme toggle in a single row
 * Serves as unified settings control
 */
export const SettingsBar: React.FC<SettingsBarProps> = ({ className = "" }) => {
  const { theme, toggle } = useTheme();
  const { language, setLanguage, isLoading } = useLanguage();
  const { t } = useTranslation();

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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Language Switcher Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isLoading}
            className="relative"
          >
            <Globe className="w-4 h-4" />
            <span className="sr-only">Select language</span>
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
              onSelect={() => {
                void handleLanguageChange(lang.code);
              }}
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

      {/* Theme Toggle Button */}
      <Button
        onClick={toggle}
        variant="outline"
        size="icon"
        className="relative"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
};

export default SettingsBar;
