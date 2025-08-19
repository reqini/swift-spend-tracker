import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import DetailedDebug from "./components/DetailedDebug";
import SimpleFallback from "./components/SimpleFallback";

const App = () => {
  const hasRequiredEnvVars = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!hasRequiredEnvVars) {
    return <SimpleFallback />;
  }

  return (
    <TooltipProvider>
      <DetailedDebug />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
