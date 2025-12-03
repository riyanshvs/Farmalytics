import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import farmBg from "@/assets/farm-field-bg.jpg";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/firebaseService";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // mode is either "signin" or "signup" depending on route
  const mode = location.pathname.includes("signup") ? "signup" : "signin";

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    // Ensure Firebase is configured
    if (!auth) {
      console.error("Firebase Auth is not configured. VITE_FIREBASE_API_KEY may be missing.");
      toast.error("Firebase not configured. Add VITE_FIREBASE_API_KEY to .env and restart the dev server.");
      return;
    }

    // Prepare phone number (assume India +91 if 10 digits provided)
    let phoneNumber = phone.trim();
    if (/^\d{10}$/.test(phoneNumber)) {
      phoneNumber = `+91${phoneNumber}`;
    }

    try {
      // Ensure Firebase auth is configured
      if (!auth) {
        console.error("Firebase Auth is not configured. VITE_FIREBASE_API_KEY may be missing.");
        toast.error("Firebase not configured. Add VITE_FIREBASE_API_KEY to .env and restart the dev server.");
        return;
      }

      // Check recaptcha readiness from retry logic in useEffect
      if (recaptchaError) {
        console.error("reCAPTCHA init error:", recaptchaError);
        toast.error(recaptchaError);
        return;
      }
      if (!recaptchaReady) {
        console.warn("reCAPTCHA verifier not ready yet");
        toast.error("reCAPTCHA not ready. Please wait a moment and try again.");
        return;
      }

      // Use the recaptcha verifier created on mount by useEffect
      const appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
        // If the verifier is not yet ready, prompt user to try again
        console.error("reCAPTCHA verifier not ready");
        toast.error("reCAPTCHA not ready. Please try again in a moment.");
        return;
      }

      // Send OTP via Firebase
      try {
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast.success(`OTP sent to ${phoneNumber}`);
      } catch (err: any) {
        console.error("Firebase signInWithPhoneNumber error:", err);
        toast.error(err?.message || "Failed to send OTP. Check phone number or Firebase setup.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP. See console for details.");
    }
  };

  // Load reCAPTCHA script dynamically if not already present
  const loadReCaptcha = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).grecaptcha) return resolve();

      const existing = document.querySelector('script[src="https://www.google.com/recaptcha/api.js?render=explicit"]');
      if (existing) {
        // wait for grecaptcha to become available
        let attempts = 0;
        const iv = setInterval(() => {
          if ((window as any).grecaptcha) {
            clearInterval(iv);
            resolve();
          }
          attempts += 1;
          if (attempts > 50) {
            clearInterval(iv);
            reject(new Error('reCAPTCHA failed to load'));
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // grecaptcha should be available now
        let attempts = 0;
        const iv = setInterval(() => {
          if ((window as any).grecaptcha) {
            clearInterval(iv);
            resolve();
          }
          attempts += 1;
          if (attempts > 50) {
            clearInterval(iv);
            reject(new Error('reCAPTCHA failed to initialize'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(script);
    });
  };

  // Create the reCAPTCHA verifier once after component mounts and auth is ready
  const cancelledRef = useRef(false);

  const initRecaptcha = async () => {
    cancelledRef.current = false;
    setRecaptchaReady(false);
    setRecaptchaError(null);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const attempts = 20; // total ~4s with 200ms interval

    for (let i = 0; i < attempts && !cancelledRef.current; i++) {
      if (auth && (window as any).grecaptcha) {
        try {
          if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(
              "recaptcha-container",
              { size: "invisible" },
              auth
            );
            try {
              (window as any).recaptchaVerifier.render();
            } catch (e) {
              // ignore render errors; verifier may still be usable
            }
          }

          const appVerifier = (window as any).recaptchaVerifier;
          if (appVerifier && typeof appVerifier.verify === "function") {
            setRecaptchaReady(true);
            return;
          }
        } catch (err: any) {
          console.warn("reCAPTCHA setup attempt failed:", err?.message || err);
        }
      }

      try {
        await loadReCaptcha();
      } catch (e) {
        // ignore; will retry
      }

      await wait(200);
    }

    if (!cancelledRef.current) {
      setRecaptchaError(
        "reCAPTCHA failed to initialize. Check network/privacy settings or try disabling tracking prevention."
      );
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    initRecaptcha();
    return () => {
      cancelledRef.current = true;
    };
  }, [auth]);

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Enter the OTP (at least 4 digits)");
      return;
    }

    setIsLoading(true);
    // Confirm OTP with Firebase
    if (confirmationResult) {
      confirmationResult
        .confirm(otp)
        .then(async (result: any) => {
          // Signed in successfully.
          try {
            const userId = result.user.uid;
            
            // Save user profile to Firebase
            await saveUserProfile(userId, {
              phone: phone,
              name: mode === "signup" ? name : localStorage.getItem("userName") || name
            });

            toast.success("OTP verified — logged in");
            if (mode === "signup" && name) localStorage.setItem("userName", name);
            localStorage.setItem("userPhone", phone);
            navigate("/hi");
          } catch (error: any) {
            console.error("Error saving user profile:", error);
            toast.error("Logged in but failed to save profile. Please try again.");
          } finally {
            setIsLoading(false);
          }
        })
        .catch((err: any) => {
          console.error("Invalid OTP:", err);
          toast.error("Invalid OTP. Please try again.");
          setIsLoading(false);
        });
    } else {
      toast.error("No OTP request found. Please resend OTP.");
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
              {/* Visible banner when reCAPTCHA failed to initialize */}
              {recaptchaError && (
                <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm mb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>{recaptchaError}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // clear error and retry init
                          setRecaptchaError(null);
                          initRecaptcha();
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {/* reCAPTCHA container (Firebase uses this) */}
              <div id="recaptcha-container" />
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
                {isLoading ? "Verifying..." : "Verify OTP"}
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
