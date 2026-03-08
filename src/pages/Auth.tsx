import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import farmBg from "@/assets/farm-field-bg.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sendOTP, login, updateProfile } = useAuth();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error(t("auth.invalidPhone"));
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await sendOTP(phone);
      
      if (result.success) {
        toast.success(t("auth.otpSent"));
        setOtpSent(true);
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error(t("auth.invalidOtp"));
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(phone, otp);
      
      if (result.success) {
        if (name) {
          await updateProfile({ name });
        }
        toast.success(t("common.success"));
        navigate("/dashboard");
      } else {
        toast.error(result.message || t("auth.loginFailed"));
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      toast.error(t("auth.loginFailed"));
    } finally {
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
          <h1 className="text-4xl font-bold text-center mb-2">{t("auth.title")}</h1>
          <p className="text-center text-muted-foreground mb-6">{t("auth.subtitle")}</p>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                type="text"
                placeholder={t("auth.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 rounded-xl border-2"
              />

              <Input
                type="tel"
                placeholder={t("auth.phonePlaceholder")}
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
                {isLoading ? t("common.loading") : t("auth.sendOtp")}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t("auth.otpSent")}
              </p>
              <Input
                type="text"
                placeholder={t("auth.otpPlaceholder")}
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
                {isLoading ? t("common.loading") : t("auth.verifyOtp")}
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
                  {t("common.back")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setOtp("");
                    handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  className="flex-1"
                >
                  {t("auth.resendOtp")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
