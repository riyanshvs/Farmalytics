import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Hi from "./pages/Hi";
import Location from "./pages/Location";
import FarmSize from "./pages/FarmSize";
import CropsSelect from "./pages/CropsSelect";
import FarmDistribution from "./pages/FarmDistribution";
import Completion from "./pages/Completion";
import Dashboard from "./pages/Dashboard";
import ComingSoon from "./pages/ComingSoon";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/hi" element={<Hi />} />
          <Route path="/location" element={<Location />} />
          <Route path="/farm-size" element={<FarmSize />} />
          <Route path="/crops-select" element={<CropsSelect />} />
          <Route path="/farm-distribution" element={<FarmDistribution />} />
          <Route path="/completion" element={<Completion />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crops-price" element={<ComingSoon />} />
          <Route path="/weather-soil" element={<ComingSoon />} />
          <Route path="/news-reports" element={<ComingSoon />} />
          <Route path="/alerts" element={<ComingSoon />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
