import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";

const ComingSoon = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-primary">{t("pages.comingSoon.title")}</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          {t("pages.comingSoon.subtitle")}
        </p>
        <Button
          onClick={() => navigate("/dashboard")}
          size="lg"
          className="mt-8"
        >
          <Home className="w-5 h-5 mr-2" />
          {t("pages.comingSoon.backToDashboard")}
        </Button>
      </div>
    </div>
  );
};

export default ComingSoon;
