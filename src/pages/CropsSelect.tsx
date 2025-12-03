import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { saveSelectedCrops } from "@/lib/firebaseService";
import { auth } from "@/lib/firebase";

const crops = [
  { name: "Potato", image: "🥔" },
  { name: "Kheera", image: "🥒" },
  { name: "Onion", image: "🧅" },
  { name: "Garlic", image: "🧄" },
  { name: "Tomato", image: "🍅" },
  { name: "Ginger", image: "🫚" }
];

const CropsSelect = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
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
      toast.error("Please select at least one crop");
      return;
    }

    setIsLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error("User not authenticated. Please sign in again.");
        return;
      }

      // Save selected crops to Firebase
      await saveSelectedCrops(userId, { crops: selectedCrops });
      toast.success("Crops saved successfully!");
      
      // persist selection for next page
      localStorage.setItem("selectedCrops", JSON.stringify(selectedCrops));
      navigate("/farm-distribution");
    } catch (error: any) {
      console.error("Error saving crops:", error);
      toast.error(error.message || "Failed to save crops. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-12">
        We Would Like To Know
      </h1>
      
      <div className="w-full max-w-3xl bg-card rounded-3xl shadow-xl p-8 border-2 border-border">
        <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
          Your Crops
        </h2>
        
        <Input
          type="text"
          placeholder="Search Crop, vegetable, fruits etc.."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-8 h-12 rounded-xl border-b-2"
        />
        
        <div className="grid grid-cols-2 gap-4">
          {filteredCrops.map((crop) => (
            <button
              key={crop.name}
              onClick={() => toggleCrop(crop.name)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                selectedCrops.includes(crop.name)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl">
                {crop.image}
              </div>
              <span className="text-xl font-semibold flex-1 text-left">
                {crop.name}
              </span>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                selectedCrops.includes(crop.name)
                  ? "bg-primary border-primary"
                  : "border-muted-foreground"
              }`}>
                <Plus className={`w-5 h-5 ${
                  selectedCrops.includes(crop.name) ? "text-white" : "text-primary"
                }`} />
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-3xl mt-6 flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedCrops.length === 0 || isLoading}
          className={`h-14 px-6 rounded-xl text-lg font-semibold text-white ${
            selectedCrops.length === 0 || isLoading ? "bg-muted-foreground/40 cursor-not-allowed" : "bg-primary"
          }`}
        >
          {isLoading ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default CropsSelect;
