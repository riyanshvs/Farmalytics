import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SettingsBar } from "@/components/SettingsBar";
import { RefreshCw } from "lucide-react";
import farmBg from "@/assets/farm-field-bg.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sendOTP, login, updateProfile } = useAuth();
  const { language } = useLanguage();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string>("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error(t("auth.invalidPhone"));
      return;
    }

    setIsLoading(true);
    setOtpMessage("");
    
    try {
      const result = await sendOTP(phone);
      
      if (result.success) {
        console.log(
          "%c✅ OTP sent successfully! Check browser console (F12) for OTP details",
          "background: #4ade80; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold;"
        );
        
        setOtpMessage(
          "✅ OTP sent! Check your browser console (Press F12) to see the OTP code for testing."
        );
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

      {/* Settings Bar - Top Right (Language + Theme) */}
      <div className="absolute top-6 right-6 z-20">
        <SettingsBar />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-border">
          <h1 className="text-4xl font-bold text-center mb-2">{t("auth.title")}</h1>
          <p className="text-center text-muted-foreground mb-8">{t("auth.subtitle")}</p>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("auth.nameLabel")}</label>
                <Input
                  type="text"
                  placeholder={t("auth.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-xl border-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t("auth.phoneLabel")}</label>
                <Input
                  type="tel"
                  placeholder={t("auth.phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  className="h-14 rounded-xl border-2"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
                disabled={isLoading || !phone}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </span>
                ) : (
                  t("auth.sendOtp")
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {otpMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">{otpMessage}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                {t("auth.otpSent")}
              </p>
              
              <div>
                <label className="text-sm font-medium mb-2 block">{t("auth.otpLabel")}</label>
                <Input
                  type="text"
                  placeholder={t("auth.otpPlaceholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="h-14 rounded-xl border-2 text-center tracking-widest text-2xl font-bold"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </span>
                ) : (
                  t("auth.verifyOtp")
                )}
              </Button>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setOtpMessage("");
                  }} 
                  className="flex-1"
                  disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("auth.resendOtp")}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-white/80">
          <p>💡 {language === "en" ? "For testing, check your browser console (F12) for the OTP code" : "परीक्षण के लिए, ओटीपी कोड के लिए अपने ब्राउज़र कंसोल (F12) को देखें"}</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
