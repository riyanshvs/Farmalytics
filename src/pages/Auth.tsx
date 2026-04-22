import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { SettingsBar } from "@/components/SettingsBar";
import { RefreshCw, Mail, Lock, UserRound, Eye, EyeOff } from "lucide-react";
import farmBg from "@/assets/farm-field-bg.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MIN_PASSWORD_LENGTH = 8;

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { login, register, sendPasswordReset } = useAuth();

  const isSignUpPath = location.pathname === "/signup";
  const [mode, setMode] = useState<"signin" | "signup">(isSignUpPath ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupHint, setShowSignupHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMode(location.pathname === "/signup" ? "signup" : "signin");
  }, [location.pathname]);

  const title = useMemo(
    () =>
      mode === "signup"
        ? t("auth.signUpTitle")
        : t("auth.signInTitle"),
    [mode, t]
  );

  const subtitle = useMemo(
    () =>
      mode === "signup"
        ? t("auth.signUpSubtitle")
        : t("auth.signInSubtitle"),
    [mode, t]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      toast.error(t("auth.emailInvalid"));
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(t("auth.passwordRule"));
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const result =
        mode === "signup"
          ? await register(email, password, name)
          : await login(email, password);

      if (!result.success) {
        toast.error(result.message || t("auth.loginFailed"));
        if (mode === "signin") {
          setShowSignupHint(true);
        }
        return;
      }

      toast.success(mode === "signup" ? t("auth.accountCreated") : t("common.success"));
      navigate(result.onboardingCompleted ? "/dashboard" : "/location");
    } catch (error) {
      console.error("Auth submit failed unexpectedly:", error);
      toast.error(t("auth.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.includes("@")) {
      toast.error(t("auth.resetEmailPrompt"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordReset(email);
      if (!result.success) {
        toast.error(result.message || t("auth.resetFailed"));
        return;
      }
      toast.success(t("auth.resetSent"));
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

      <div className="absolute top-6 right-6 z-20">
        <SettingsBar />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-border">
          <h1 className="text-3xl font-bold text-center mb-2">{title}</h1>
          <p className="text-center text-muted-foreground mb-8">{subtitle}</p>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-muted">
            <Button
              type="button"
              variant={mode === "signin" ? "default" : "ghost"}
              onClick={() => navigate("/signin")}
              disabled={isLoading}
            >
              {t("auth.signInTab")}
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "ghost"}
              onClick={() => navigate("/signup")}
              disabled={isLoading}
            >
              {t("auth.signUpTab")}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t("auth.nameLabel")}</label>
                <div className="relative">
                  <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("auth.namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-2 pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">{t("auth.emailLabel")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="h-12 rounded-xl border-2 pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t("auth.passwordLabel")}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-2 pl-9 pr-10"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t("auth.confirmPasswordLabel")}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-xl border-2 pl-9 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </span>
              ) : mode === "signup" ? (
                t("auth.createAccount")
              ) : (
                t("auth.signInButton")
              )}
            </Button>

            {mode === "signin" && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                {t("auth.forgotPassword")}
              </Button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? t("auth.existingUserPrompt") : t("auth.newUserPrompt")}{" "}
            <button
              type="button"
              onClick={() => navigate(mode === "signup" ? "/signin" : "/signup")}
              className="font-semibold text-primary underline-offset-4 hover:underline"
              disabled={isLoading}
            >
              {mode === "signup" ? t("auth.loginAction") : t("auth.signUpAction")}
            </button>
          </p>
        </div>
      </div>

      <Dialog open={showSignupHint} onOpenChange={setShowSignupHint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auth.signupHintTitle")}</DialogTitle>
            <DialogDescription>{t("auth.signupHintDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignupHint(false)}>
              {t("auth.signupHintStay")}
            </Button>
            <Button
              onClick={() => {
                setShowSignupHint(false);
                navigate("/signup");
              }}
            >
              {t("auth.signupHintGo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
