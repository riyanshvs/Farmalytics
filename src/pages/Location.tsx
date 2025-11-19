import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Location = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    pincode: "",
    state: "",
    country: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.city || !formData.pincode || !formData.state || !formData.country) {
      toast.error("Please fill in all fields");
      return;
    }
    
    navigate("/farm-size");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-12">
        We Would Like To Know
      </h1>
      
      <div className="w-full max-w-lg bg-card rounded-3xl shadow-xl p-8 border-2 border-border">
        <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
          Location
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0"
          />
          
          <Input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0"
          />
          
          <Input
            type="text"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({...formData, pincode: e.target.value})}
            className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0"
          />
          
          <Input
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={(e) => setFormData({...formData, state: e.target.value})}
            className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0"
          />
          
          <Input
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
            className="h-12 rounded-xl border-b-2 border-t-0 border-l-0 border-r-0 rounded-none px-0"
          />
          
          <div className="pt-6">
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

export default Location;
