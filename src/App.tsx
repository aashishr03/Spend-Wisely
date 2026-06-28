import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIAssistant } from "@/components/AIAssistant";

// Lazy-loaded route pages — splits recharts, jspdf, react-markdown, etc. per route.
const AuthPage = lazy(() => import("./pages/Auth"));
const EmailVerified = lazy(() => import("./pages/EmailVerified"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const Transactions = lazy(() => import("./pages/Transactions"));
const AddTransaction = lazy(() => import("./pages/AddTransaction"));
const Goals = lazy(() => import("./pages/Goals"));
const Coach = lazy(() => import("./pages/Coach"));
const Investments = lazy(() => import("./pages/Investments"));
const Report = lazy(() => import("./pages/Report"));
const Budgets = lazy(() => import("./pages/Budgets"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  // Hide floating assistant on Coach (it's the main chat) and on auth/onboarding
  const hideOn = ['/coach', '/auth', '/onboarding'];
  const showAI = user
    && !hideOn.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/mentor" element={<Navigate to="/coach" replace />} />
          <Route path="/insights" element={<Navigate to="/report" replace />} />
          <Route path="/invest" element={<Navigate to="/investments" replace />} />

          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/verified" element={<EmailVerified />} />

          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/add-transaction" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
          <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showAI && <AIAssistant />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
