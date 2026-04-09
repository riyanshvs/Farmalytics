import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";

const FarmSize = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [farmSize, setFarmSize] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmSize) {
      toast.error(t("welcome.enterFarmSize"));
      return;
    }
    
    setIsLoading(true);
    try {
      const farmSizeNum = parseFloat(farmSize);
      localStorage.setItem("farmSize", farmSize);
      
      try {
        await api.farm.save({ farmSize: farmSizeNum });
      } catch (apiError) {
        console.warn("API save failed, data stored locally:", apiError);
      }
      
      toast.success(t("common.success"));
      navigate("/crops-select");
    } catch (error: unknown) {
      console.error("Error saving farm size:", error);
      toast.error(error instanceof Error ? error.message : t("welcome.farmSizeSaveFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-12">
        {t("welcome.farmSizeTitle")}
      </h1>
      
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border-2 border-border">
        <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
          {t("welcome.farmSizeSubtitle")}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="text-center">
            <Input
              type="number"
              placeholder={t("welcome.farmSizePlaceholder")}
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
              className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0 text-center text-2xl font-bold w-32 mx-auto"
            />
            <p className="text-muted-foreground mt-2">{t("welcome.farmSizeLabel")}</p>
          </div>
          
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
          >
            {isLoading ? t("common.loading") : t("common.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FarmSize;
