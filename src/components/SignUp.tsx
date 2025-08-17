// src/components/SignUp.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function strengthLabel(score: number) {
  switch (score) {
    case 0:
    case 1:
      return "Very weak";
    case 2:
      return "Weak";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
}

export function SignUp() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState(""); // ✅ new phone field
  const [showPassword, setShowPassword] = useState(false);

  const [agreeTos, setAgreeTos] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const score = passwordStrength(password);
  const strength = strengthLabel(score);

  const validate = () => {
    setError(null);
    if (!email.includes("@") || email.length < 5) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return false;
    }
    if (score < 2) {
      setError("Choose a stronger password (add numbers, symbols, uppercase).");
      return false;
    }
    if (!agreeTos) {
      setError("You must accept the Terms & Conditions to continue.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validate()) return;

    setBusy(true);
    try {
      // ✅ only expect { error } from signUp
      const { error: signError } = await signUp(email, password);

      if (signError) {
        console.error("SignUp error:", signError);
        setError(signError.message ?? "Sign up failed. Please try again.");
      } else {
        // ✅ Insert into profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{ email, phone }]);

        if (profileError) {
          console.error("Profile insert error:", profileError);
        }

        setSuccessMsg(
          "Success — check your email for a confirmation link (if required). You can now sign in."
        );
        setEmail("");
        setPassword("");
        setConfirm("");
        setPhone("");
        setAgreeTos(false);
      }
    } catch (err: any) {
      console.error("Unexpected sign up error:", err);
      setError(err?.message ?? "Sign up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      setError(err?.message ?? "Google sign-up failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

      <div>
        <Label htmlFor="su-email">Email</Label>
        <Input
          id="su-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="su-phone">Phone Number</Label>
        <Input
          id="su-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
      </div>

      <div>
        <Label htmlFor="su-password">Password</Label>
        <div className="relative">
          <Input
            id="su-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-2 text-sm opacity-70"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                aria-hidden
                className={`h-1 w-8 rounded ${
                  i < score ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-muted-foreground">{strength}</div>
        </div>
      </div>

      <div>
        <Label htmlFor="su-confirm">Confirm Password</Label>
        <Input
          id="su-confirm"
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="tos"
          type="checkbox"
          checked={agreeTos}
          onChange={(e) => setAgreeTos(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="tos" className="text-sm text-muted-foreground">
          I agree to the{" "}
          <a href="/terms" className="underline">
            Terms &amp; Conditions
          </a>
        </label>
      </div>

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Creating account..." : "Create account"}
      </Button>

      <div className="my-3 flex items-center gap-2">
        <hr className="flex-1 border-muted-foreground/30" />
        <span className="text-sm text-muted-foreground">OR</span>
        <hr className="flex-1 border-muted-foreground/30" />
      </div>

      <Button
        variant="outline"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full"
      >
        Continue with Google
      </Button>
    </form>
  );
}
