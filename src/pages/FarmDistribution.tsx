import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const defaultCrops = [
  { name: "Potato", image: "🥔" },
  { name: "Potato", image: "🥔" },
  { name: "Cucumber", image: "🥒" },
  { name: "Cucumber", image: "🥒" },
  { name: "Onion", image: "🧅" },
  { name: "Onion", image: "🧅" }
];

const FarmDistribution = () => {
  const navigate = useNavigate();
  const [distributions, setDistributions] = useState<Record<number, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allFilled = defaultCrops.every((_, index) => distributions[index]);
    if (!allFilled) {
      toast.error("Please fill in all areas");
      return;
    }
    
    navigate("/completion");
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
            {defaultCrops.map((crop, index) => (
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
              className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmDistribution;
