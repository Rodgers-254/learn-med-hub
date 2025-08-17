// src/App.tsx
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Books from "./pages/Books";
import Library from "./pages/Library";
import TermsOfService from "./pages/TermsOfService";
import Payment from "./pages/Payment"; // ✅ New payment page

import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";

import SignIn from "@/components/SignIn";
import { SignUp } from "@/components/SignUp";

const queryClient = new QueryClient();
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const HomeWrapper: React.FC = () => {
  const { user } = useAuth();
  return user ? (
    <Index />
  ) : (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Learn Med Hub</h1>
      <div className="w-full max-w-md space-y-6">
        <SignIn />
        <div className="my-4 border-t" />
        <SignUp />
      </div>
    </div>
  );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        setIsAdmin(false);
        return;
      }

      const email = authData.user.email?.toLowerCase() || "";
      if (email && ADMIN_EMAILS.includes(email)) {
        setIsAdmin(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        console.error("Admin check error:", error.message);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.is_super_admin === true);
    };

    check();
  }, []);

  if (isAdmin === null) return <div className="p-6">Checking admin permissions...</div>;
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<HomeWrapper />} />
      <Route path="/books" element={<Books />} />
      <Route path="/library" element={user ? <Library /> : <SignIn />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      
      {/* ✅ FIXED: use plain /payment so it can accept ?id=123 */}
      <Route path="/payment" element={<Payment />} />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Header />
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
