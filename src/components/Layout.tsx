import { Home, Sprout, FileText, AlertTriangle, User, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { SettingsBar } from "@/components/SettingsBar";
import { cn } from "@/lib/utils";

const UserName = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  return <span className="font-semibold">{user?.name || t("layout.userFallback")}</span>;
};

interface LayoutProps {
  children: React.ReactNode;
}

interface SidebarContentProps {
  showSettings?: boolean;
  framed?: boolean;
}

const SidebarContent = ({ showSettings = true, framed = false }: SidebarContentProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userInitial = (user?.name || "U").trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        framed && "rounded-3xl border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      )}
    >
      <div className="flex items-center gap-3 mb-10 px-6 pt-6">
        <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
          <Sprout className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-[28px] leading-none font-bold text-primary tracking-tight">Farmalytics</span>
      </div>

      <nav className="flex-1 space-y-1.5 px-6">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:text-primary transition-colors"
          activeClassName="font-semibold text-foreground underline underline-offset-4 decoration-2"
        >
          <Home className="w-5 h-5" />
          <span>{t("dashboard.title")}</span>
        </NavLink>

        <NavLink
          to="/crops-price"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:text-primary transition-colors"
          activeClassName="font-semibold text-foreground underline underline-offset-4 decoration-2"
        >
          <Sprout className="w-5 h-5" />
          <span>{t("dashboard.cropsPrice")}</span>
        </NavLink>

        <NavLink
          to="/weather-soil"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:text-primary transition-colors"
          activeClassName="font-semibold text-foreground underline underline-offset-4 decoration-2"
        >
          <FileText className="w-5 h-5" />
          <span>{t("dashboard.weatherSoil")}</span>
        </NavLink>

        <NavLink
          to="/news-reports"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:text-primary transition-colors"
          activeClassName="font-semibold text-foreground underline underline-offset-4 decoration-2"
        >
          <FileText className="w-5 h-5" />
          <span>{t("dashboard.newsReports")}</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:text-primary transition-colors"
          activeClassName="font-semibold text-foreground underline underline-offset-4 decoration-2"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>{t("dashboard.alerts")}</span>
        </NavLink>

        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:text-primary transition-colors"
          activeClassName="font-semibold text-foreground underline underline-offset-4 decoration-2"
        >
          <User className="w-5 h-5" />
          <span>{t("dashboard.profile")}</span>
        </NavLink>
      </nav>

      <div className="px-6 pb-6 pt-4">
        <div className="flex items-center gap-3 p-2.5 rounded-xl mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-emerald-300 rounded-full flex items-center justify-center font-bold text-emerald-900">
            {userInitial}
          </div>
          <span className="text-2xl font-semibold leading-none">
            <UserName />
          </span>
        </div>

        {showSettings && <SettingsBar className="w-full" />}
      </div>
    </div>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:block w-[300px] p-4 bg-background">
        <div className="sticky top-4 h-[calc(100vh-2rem)]">
          <SidebarContent showSettings={false} framed />
        </div>
      </aside>

      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary">Farmalytics</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SettingsBar />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SidebarContent showSettings={false} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
