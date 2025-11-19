import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import farmBg from "@/assets/farm-field-bg-2.jpg";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    language: "",
    password: "",
    confirmPassword: ""
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.language || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Store user name for later use
    localStorage.setItem("userName", formData.name);
    navigate("/hi");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative py-8"
      style={{ backgroundImage: `url(${farmBg})` }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-border">
          <h1 className="text-4xl font-bold text-center mb-8">Sign Up</h1>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="h-14 rounded-xl border-2"
            />
            
            <Input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="h-14 rounded-xl border-2"
            />
            
            <Input
              type="text"
              placeholder="Language"
              value={formData.language}
              onChange={(e) => setFormData({...formData, language: e.target.value})}
              className="h-14 rounded-xl border-2"
            />
            
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="h-14 rounded-xl border-2"
            />
            
            <Input
              type="password"
              placeholder="Re-enter Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="h-14 rounded-xl border-2"
            />
            
            <Button 
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 mt-6"
            >
              Register
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
