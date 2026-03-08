import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const cropIcons: Record<string, string> = {
  Potato: "🥔",
  Kheera: "🥒",
  Onion: "🧅",
  Garlic: "🧄",
  Tomato: "🍅",
  Ginger: "🫚",
  Cucumber: "🥒"
};

const FarmDistribution = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  // read selected crops from localStorage
  const stored = typeof window !== "undefined" ? localStorage.getItem("selectedCrops") : null;
  const selectedNames: string[] = stored ? JSON.parse(stored) : [];

  const crops = selectedNames.length > 0 ? selectedNames.map((name) => ({ name, image: cropIcons[name] || "🌾" })) : [
    { name: "Potato", image: "🥔" },
  ];

  const [distributions, setDistributions] = useState<Record<number, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allFilled = crops.every((_, index) => distributions[index]);
    if (!allFilled) {
      toast.error("Please fill in all areas");
      return;
    }

    setIsLoading(true);
    try {
      // prepare distribution data as array of { name, area }
      const distributionData = crops.map((c, index) => ({ 
        name: c.name, 
        area: Number(distributions[index] || 0) 
      }));
      const totalArea = distributionData.reduce((sum, d) => sum + d.area, 0);

      // Save to localStorage
      localStorage.setItem("farmDistributions", JSON.stringify(distributionData));

      toast.success("Farm distribution saved successfully!");
      navigate("/completion");
    } catch (error: any) {
      console.error("Error saving farm distribution:", error);
      toast.error(error.message || "Failed to save distribution. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-12">
        We Would Like To Know
      </h1>
      
      <div className="w-full max-w-3xl bg-card rounded-3xl shadow-xl p-8 border-2 border-border">
        <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
          Your Farm Distribution
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {crops.map((crop, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
                  {crop.image}
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-2">{crop.name}</p>
                  <Input
                    type="text"
                    placeholder="Area Cultivated"
                    value={distributions[index] || ""}
                    onChange={(e) => setDistributions({...distributions, [index]: e.target.value})}
                    className="h-10 rounded-xl bg-secondary border-0"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmDistribution;
