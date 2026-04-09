import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";
import { cropsCatalog } from "@/data/cropsCatalog";
import { safeJsonParse } from "@/lib/safeJson";

const CropsSelect = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(
    safeJsonParse<string[]>(localStorage.getItem("selectedCrops"), [])
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCrop = (cropName: string) => {
    if (selectedCrops.includes(cropName)) {
      setSelectedCrops(selectedCrops.filter(c => c !== cropName));
    } else {
      setSelectedCrops([...selectedCrops, cropName]);
    }
  };

  const handleNext = async () => {
    if (selectedCrops.length === 0) {
      toast.error(t("welcome.selectAtLeastOneCrop"));
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem("selectedCrops", JSON.stringify(selectedCrops));
      
      try {
        await api.farm.save({ selectedCrops });
      } catch (apiError) {
        console.warn("API save failed, data stored locally:", apiError);
      }
      
      toast.success(t("common.success"));
      navigate("/farm-distribution");
    } catch (error) {
      console.error("Error saving crops:", error);
      toast.error(t("welcome.cropsSaveFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCrops = cropsCatalog.filter((crop) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      crop.nameEn.toLowerCase().includes(search) ||
      crop.nameHi.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-12">
        {t("welcome.cropsTitle")}
      </h1>
      
      <div className="w-full max-w-3xl bg-card rounded-3xl shadow-xl p-8 border-2 border-border">
        <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
          {t("welcome.cropsSubtitle")}
        </h2>
        
        <Input
          type="text"
          placeholder={t("welcome.cropsSearchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-8 h-12 rounded-xl border-b-2"
        />

        <div className="max-h-[460px] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
          {filteredCrops.map((crop) => (
            <button
              key={crop.id}
              onClick={() => toggleCrop(crop.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                selectedCrops.includes(crop.id)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl">
                {crop.emoji}
              </div>
              <span className="text-xl font-semibold flex-1 text-left">
                {language === "hi" ? crop.nameHi : crop.nameEn}
              </span>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                selectedCrops.includes(crop.id)
                  ? "bg-primary border-primary"
                  : "border-muted-foreground"
              }`}>
                <Plus className={`w-5 h-5 ${
                  selectedCrops.includes(crop.id) ? "text-white" : "text-primary"
                }`} />
              </div>
            </button>
          ))}
          </div>
        </div>
      </div>
      <div className="w-full max-w-3xl mt-6 flex justify-end">
        <Button
          onClick={handleNext}
          disabled={selectedCrops.length === 0 || isLoading}
          className={`h-14 px-6 rounded-xl text-lg font-semibold ${
            selectedCrops.length === 0 || isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? t("common.loading") : t("common.next")}
        </Button>
      </div>
    </div>
  );
};

export default CropsSelect;
