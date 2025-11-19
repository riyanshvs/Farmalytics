import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import farmBg from "@/assets/farm-field-bg.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // mode is either "signin" or "signup" depending on route
  const mode = location.pathname.includes("signup") ? "signup" : "signin";

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    // In a real app you'd call an API to generate+send OTP.
    // For demo we simulate OTP sent and show toast.
    setOtpSent(true);
    toast.success(`OTP sent to ${phone}`);
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Enter the OTP (at least 4 digits)");
      return;
    }

    // Simulate verification success
    toast.success("OTP verified — logged in");
    // store simple user info (demo)
    if (mode === "signup" && name) localStorage.setItem("userName", name);
    localStorage.setItem("userPhone", phone);
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
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 rounded-xl border-2"
              />

              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl bg-primary">
                Generate OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter the OTP sent to {phone}</p>
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-14 rounded-xl border-2 text-center tracking-widest text-lg"
              />

              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl bg-primary">
                Verify OTP
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOtpSent(false)} className="flex-1">
                  Edit Phone
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOtp("");
                    toast(`Resending OTP to ${phone}`);
                  }}
                  className="flex-1"
                >
                  Resend OTP
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center border-t pt-4">
            <p className="text-muted-foreground">{mode === "signin" ? "Don't have an account?" : "Already registered?"}</p>
            <div className="mt-3 flex gap-3 justify-center">
              <Button onClick={() => navigate('/signin')} variant={mode === 'signin' ? undefined : 'outline'}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')} variant={mode === 'signup' ? undefined : 'outline'}>
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
