import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import farmBg from "@/assets/farm-field-bg.jpg";

const SignIn = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    // For demo purposes, navigate to hi page
    navigate("/hi");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${farmBg})` }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-border">
          <h1 className="text-4xl font-bold text-center mb-8">Sign In</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 rounded-xl border-2"
            />
            
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-xl border-2"
            />
            
            <button
              type="button"
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Forgot Password ?
            </button>
            
            <Button 
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
            >
              Login
            </Button>
          </form>
          
          <div className="mt-8 text-center border-t pt-6">
            <p className="text-muted-foreground mb-4">Don't have an account ?</p>
            <Button
              onClick={() => navigate("/signup")}
              variant="outline"
              className="w-full h-14 text-lg font-bold rounded-xl"
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
