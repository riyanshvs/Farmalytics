import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const FarmSize = () => {
  const navigate = useNavigate();
  const [farmSize, setFarmSize] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmSize) {
      toast.error("Please enter your farm size");
      return;
    }
    
    navigate("/crops-select");
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
            className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FarmSize;
