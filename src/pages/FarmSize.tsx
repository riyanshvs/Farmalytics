import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saveFarmSize } from "@/lib/firebaseService";
import { auth } from "@/lib/firebase";

const FarmSize = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [farmSize, setFarmSize] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmSize) {
      toast.error("Please enter your farm size");
      return;
    }
    
    setIsLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error("User not authenticated. Please sign in again.");
        return;
      }

      // Save farm size to Firebase
      await saveFarmSize(userId, { farmSize });
      toast.success("Farm size saved successfully!");
      navigate("/crops-select");
    } catch (error: any) {
      console.error("Error saving farm size:", error);
      toast.error(error.message || "Failed to save farm size. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-12">
        We Would Like To Know
      </h1>
      
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border-2 border-border">
        <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
          Your Farm Size
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            type="text"
            placeholder=""
            value={farmSize}
            onChange={(e) => setFarmSize(e.target.value)}
            className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0 text-center"
          />
          
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Saving..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FarmSize;
