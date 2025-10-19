import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Dashboard } from "./components/Dashboard";
import AIAssistantPage from "./components/ai";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Add language switcher to top-right */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard onCapsuleClick={(id) => console.log(id)} />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          {/* Catch-all must come last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
