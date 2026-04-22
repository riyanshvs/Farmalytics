import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import bg from "@/assets/farm-field-bg.jpg";
import { useTranslation } from "react-i18next";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      <img
        src={bg}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchpriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/25" />

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="icon" className="bg-white/90 hover:bg-white text-black" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        <div>
          <h1 className="mb-4 text-5xl md:text-7xl font-bold text-white">Farmalytics</h1>
          <p className="text-xl text-white/90">{t("pages.index.subtitle")}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate("/signin")}
            size="lg"
            className="text-lg px-8 rounded-xl"
          >
            {t("pages.index.signIn")}
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            variant="outline"
            className="text-lg px-8 rounded-xl"
          >
            {t("pages.index.signUp")}
          </Button>
        </div>

        {/* center hero image removed per request; background image remains */}
      </div>
    </div>
  );
};

export default Index;
