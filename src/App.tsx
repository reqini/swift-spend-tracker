import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import LiveDebug from "./components/LiveDebug";

const App = () => {
  const [showDebug, setShowDebug] = React.useState(false);

  // Siempre mostrar la app, ya que Supabase tiene valores por defecto
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      {/* <LiveDebug isVisible={showDebug} onToggle={() => setShowDebug(!showDebug)} /> */}
    </TooltipProvider>
  );
};

export default App;
