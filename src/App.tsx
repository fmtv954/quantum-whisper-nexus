import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import OnboardingWelcome from "./pages/onboarding/Welcome";
import OnboardingCampaignSetup from "./pages/onboarding/CampaignSetup";
import Dashboard from "./pages/Dashboard";
import DevDesignSystem from "./pages/DevDesignSystem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Onboarding routes (protected) */}
          <Route
            path="/onboarding/welcome"
            element={
              <ProtectedRoute>
                <OnboardingWelcome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/campaign-setup"
            element={
              <ProtectedRoute>
                <OnboardingCampaignSetup />
              </ProtectedRoute>
            }
          />
          
          {/* Protected app routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/design-system"
            element={
              <ProtectedRoute>
                <DevDesignSystem />
              </ProtectedRoute>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
