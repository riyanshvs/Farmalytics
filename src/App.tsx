import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Hi = lazy(() => import("./pages/Hi"));
const Location = lazy(() => import("./pages/Location"));
const FarmSize = lazy(() => import("./pages/FarmSize"));
const CropsSelect = lazy(() => import("./pages/CropsSelect"));
const FarmDistribution = lazy(() => import("./pages/FarmDistribution"));
const Completion = lazy(() => import("./pages/Completion"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CropsPrice = lazy(() => import("./pages/CropsPrice"));
const WeatherSoil = lazy(() => import("./pages/WeatherSoil"));
const NewsReports = lazy(() => import("./pages/NewsReports"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Profile = lazy(() => import("./pages/Profile"));
const Layout = lazy(() => import("./components/Layout"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const AppLoadingScreen = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <span
          className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
          aria-label={t("common.loading")}
        />
        <p className="text-sm text-muted-foreground">{t("common.loadingApp", { app: "Farmalytics" })}</p>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, onboardingCompleted, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!onboardingCompleted) {
    return <Navigate to="/hi" replace />;
  }

  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, onboardingCompleted, loading } = useAuth();
  const location = useLocation();
  const publicPaths = ["/", "/signin", "/signup"];
  const authPaths = ["/signin", "/signup"];
  const onboardingPaths = ["/hi", "/location", "/farm-size", "/crops-select", "/farm-distribution", "/completion"];

  if (loading) {
    if (publicPaths.includes(location.pathname) || onboardingPaths.includes(location.pathname)) {
      return <>{children}</>;
    }
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    if (location.pathname === "/") {
      return <Navigate to="/signin" replace />;
    }

    if (publicPaths.includes(location.pathname)) {
      return <>{children}</>;
    }
    return <Navigate to="/signin" replace />;
  }

  if (isAuthenticated && onboardingCompleted) {
    if (location.pathname === "/completion" || location.pathname === "/hi" || authPaths.includes(location.pathname)) {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && !onboardingCompleted && publicPaths.includes(location.pathname)) {
    return <Navigate to="/location" replace />;
  }

  if (isAuthenticated && !onboardingCompleted && onboardingPaths.includes(location.pathname)) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<AppLoadingScreen />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <OnboardingRoute>
                      <Index />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/signin"
                  element={
                    <OnboardingRoute>
                      <Auth />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <OnboardingRoute>
                      <Auth />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/hi"
                  element={
                    <OnboardingRoute>
                      <Hi />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/location"
                  element={
                    <OnboardingRoute>
                      <Location />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/farm-size"
                  element={
                    <OnboardingRoute>
                      <FarmSize />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/crops-select"
                  element={
                    <OnboardingRoute>
                      <CropsSelect />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/farm-distribution"
                  element={
                    <OnboardingRoute>
                      <FarmDistribution />
                    </OnboardingRoute>
                  }
                />
                <Route
                  path="/completion"
                  element={
                    <OnboardingRoute>
                      <Completion />
                    </OnboardingRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/crops-price"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CropsPrice />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/weather"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <WeatherSoil />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/news"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <NewsReports />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Alerts />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/weather-soil" element={<Navigate to="/weather" replace />} />
                <Route path="/news-reports" element={<Navigate to="/news" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
