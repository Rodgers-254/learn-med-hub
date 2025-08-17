// src/components/SignIn.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

/* Small inline Google icon */
const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 533.5 544.3" width="18" height="18" {...props}>
    <path fill="#4285F4" d="M533.5 278.4c0-17.7-1.6-35-4.7-51.6H272.1v97.8h147.1c-6.3 34-25.6 62.9-54.6 82v68h88.6c51.9-47.9 81.3-118.7 81.3-196.2z" />
    <path fill="#34A853" d="M272.1 544.3c73.7 0 135.6-24.5 180.8-66.5l-88.6-68c-24.6 16.6-56 26.4-92.2 26.4-70.8 0-130.8-47.8-152.2-112.2H28.6v70.5c45.1 89.6 137.3 149.8 243.5 149.8z" />
    <path fill="#FBBC05" d="M119.9 323.9c-10.7-32.3-10.7-66.6 0-98.9V154.5H28.6c-41.8 80.7-41.8 176.9 0 257.6l91.3-88.2z" />
    <path fill="#EA4335" d="M272.1 107.7c39.9-.6 78.1 14.6 107.3 42.6l80.6-80.6C407.8 22.5 345.9-1 272.1 0 165.9 0 73.7 60.2 28.6 149.8l91.3 70.5c21.4-64.4 81.4-112.6 152.2-112.6z" />
  </svg>
);

export function SignIn() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Auto-hide errors after 5s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Email/password sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      navigate("/");
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  // Google OAuth
  const handleGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`, // after login
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed");
      setGoogleBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-6 rounded-lg shadow space-y-4">
        <h1 className="text-2xl font-bold text-center">Sign in to MedBooks</h1>

        {error && (
          <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button type="submit" className="w-full" disabled={busy || googleBusy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <hr className="flex-1 border-muted-foreground/30" />
          <span className="text-sm text-muted-foreground">OR</span>
          <hr className="flex-1 border-muted-foreground/30" />
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogle}
          disabled={busy || googleBusy}
        >
          {googleBusy ? (
            <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></span>
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

export default SignIn;
