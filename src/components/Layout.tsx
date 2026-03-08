import { Home, Sprout, Sun, FileText, AlertTriangle, User, Moon, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import useTheme from "@/lib/useTheme";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

const UserName = () => {
  const { user } = useAuth();
  return <span className="font-semibold">{user?.name || "User"}</span>;
};

interface LayoutProps {
  children: React.ReactNode;
}

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const toggleLanguage = async () => {
    const newLang = i18n.language === "hi" ? "en" : "hi";
    await i18n.changeLanguage(newLang);
    await updateProfile({ language: newLang });
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      className="w-full justify-start gap-3"
    >
      <span className="font-medium">{i18n.language === "hi" ? "हिंदी" : "English"}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {t("language.label")}
      </span>
    </Button>
  );
};

const SidebarContent = () => {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-12 px-6 pt-6">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <Sprout className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-primary">Farmalytics</span>
      </div>

      <nav className="flex-1 space-y-2 px-6">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
          activeClassName="bg-accent text-primary font-semibold"
        >
          <Home className="w-5 h-5" />
          <span>{t("dashboard.title")}</span>
        </NavLink>

        <NavLink
          to="/crops-price"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
          activeClassName="bg-accent text-primary font-semibold"
        >
          <Sprout className="w-5 h-5" />
          <span>{t("dashboard.cropsPrice")}</span>
        </NavLink>

        <NavLink
          to="/weather-soil"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
          activeClassName="bg-accent text-primary font-semibold"
        >
          <Sun className="w-5 h-5" />
          <span>{t("dashboard.weatherSoil")}</span>
        </NavLink>

        <NavLink
          to="/news-reports"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
          activeClassName="bg-accent text-primary font-semibold"
        >
          <FileText className="w-5 h-5" />
          <span>{t("dashboard.newsReports")}</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent transition-colors"
          activeClassName="bg-accent text-primary font-semibold"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>{t("dashboard.alerts")}</span>
        </NavLink>
      </nav>

      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg mb-4">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <UserName />
        </div>

        <div className="space-y-2">
          <LanguageSwitcher />
          
          <Button
            onClick={toggle}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-[280px] bg-card border-r border-border flex-col">
        <SidebarContent />
      </aside>

      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary">Farmalytics</span>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
