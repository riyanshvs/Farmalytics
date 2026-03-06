import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import farmBg from "@/assets/farm-field-bg.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname.includes("signup") ? "signup" : "signin";

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate a random 6-digit OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP locally for verification
      setGeneratedOtp(newOtp);
      
      // Log OTP to console for demo/testing
      console.log("=".repeat(40));
      console.log("OTP for phone number +91" + phone + " is: " + newOtp);
      console.log("=".repeat(40));
      
      // Show success message
      toast.success("OTP generated! Check the browser console.");
      
      setOtpSent(true);
    } catch (err: any) {
      console.error("Error generating OTP:", err);
      toast.error("Failed to generate OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    
    // Verify OTP locally
    if (otp === generatedOtp) {
      // OTP verified successfully
      console.log("OTP verified successfully for phone: +91" + phone);
      
      // Save to localStorage
      localStorage.setItem("userPhone", phone);
      if (name) localStorage.setItem("userName", name);
      
      toast.success("Verified successfully!");
      navigate("/hi");
      setIsLoading(false);
    } else {
      console.log("Invalid OTP entered:", otp, "Expected:", generatedOtp);
      toast.error("Invalid OTP. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${farmBg})` }}
    >
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-border">
          <h1 className="text-4xl font-bold text-center mb-6">{mode === "signin" ? "Sign In" : "Sign Up"}</h1>

          {!otpSent ? (
            <form onSubmit={sendOtp} className="space-y-4">
              {mode === "signup" && (
                <Input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-xl border-2"
                />
              )}

              <Input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                className="h-14 rounded-xl border-2"
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter the OTP from console (F12) for +91{phone}
              </p>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="h-14 rounded-xl border-2 text-center tracking-widest text-2xl font-bold"
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }} 
                  className="flex-1"
                >
                  Change Phone
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setOtp("");
                    sendOtp(new Event("submit") as any);
                  }}
                  className="flex-1"
                >
                  Resend OTP
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center border-t pt-4">
            <p className="text-muted-foreground text-sm">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </p>
            <div className="mt-3 flex gap-3 justify-center">
              <Button 
                onClick={() => navigate('/signin')} 
                variant={mode === 'signin' ? undefined : 'outline'}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/signup')} 
                variant={mode === 'signup' ? undefined : 'outline'}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
