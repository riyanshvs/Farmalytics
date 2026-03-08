import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Onboarding flow - no sidebar */}
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/hi" element={<Hi />} />
          <Route path="/location" element={<Location />} />
          <Route path="/farm-size" element={<FarmSize />} />
          <Route path="/crops-select" element={<CropsSelect />} />
          <Route path="/farm-distribution" element={<FarmDistribution />} />
          <Route path="/completion" element={<Completion />} />

          {/* Main app pages - with sidebar */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/crops-price" element={<Layout><CropsPrice /></Layout>} />
          <Route path="/weather-soil" element={<Layout><WeatherSoil /></Layout>} />
          <Route path="/news-reports" element={<Layout><NewsReports /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;