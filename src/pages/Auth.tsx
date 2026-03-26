import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { SettingsBar } from "@/components/SettingsBar";
import { RefreshCw, Mail, Lock, UserRound } from "lucide-react";
import farmBg from "@/assets/farm-field-bg.jpg";

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

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

  const title = useMemo(
    () => (mode === "signup" ? "Create your Farmalytics account" : "Sign in to Farmalytics"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "signup"
        ? "Use email and password to continue."
        : "Use your registered email and password.",
    [mode]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      toast.error("Password must be 8+ chars with uppercase, lowercase, number, and symbol.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      toast.error("Password and confirm password do not match.");
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
        return;
      }

      toast.success(mode === "signup" ? "Account created successfully" : t("common.success"));
      navigate(result.onboardingCompleted ? "/dashboard" : "/hi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.includes("@")) {
      toast.error("Enter your email first to reset password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordReset(email);
      if (!result.success) {
        toast.error(result.message || "Failed to send reset email.");
        return;
      }
      toast.success("Password reset email sent. Check your inbox.");
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
              onClick={() => setMode("signin")}
              disabled={isLoading}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "ghost"}
              onClick={() => setMode("signup")}
              disabled={isLoading}
            >
              Sign Up
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
              <label className="text-sm font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="h-12 rounded-xl border-2 pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-2 pl-9"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-xl border-2 pl-9"
                    autoComplete="new-password"
                  />
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
                "Create Account"
              ) : (
                "Sign In"
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
                Forgot password?
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
