import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Hi from "./pages/Hi";
import Location from "./pages/Location";
import FarmSize from "./pages/FarmSize";
import CropsSelect from "./pages/CropsSelect";
import FarmDistribution from "./pages/FarmDistribution";
import Completion from "./pages/Completion";
import Dashboard from "./pages/Dashboard";
import CropsPrice from "./pages/CropsPrice";
import WeatherSoil from "./pages/WeatherSoil";
import NewsReports from "./pages/NewsReports";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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
              path="/weather-soil"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WeatherSoil />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/news-reports"
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
