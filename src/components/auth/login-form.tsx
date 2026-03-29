import * as React from "react";
import { Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export function LoginForm({ disabled }: { disabled?: boolean }) {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedEmail = email.trim();

      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        setMode("login");
        setPassword("");
        setConfirmPassword("");

        toast.success(
          data.session
            ? "Account created."
            : "Account created. Check your email if confirmation is required.",
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        toast.success("Signed in.");
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/70">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-950">
            {mode === "login" ? "Account Login" : "Create Account"}
          </p>
          <p className="text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to open the storage dashboard"
              : "Create an account to open your own workspace"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-[1rem] px-3 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => {
              setMode("login");
              setError(null);
              setPassword("");
              setConfirmPassword("");
            }}
            disabled={disabled || isSubmitting}
          >
            Log in
          </button>
          <button
            type="button"
            className={`rounded-[1rem] px-3 py-2 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => {
              setMode("signup");
              setError(null);
              setPassword("");
              setConfirmPassword("");
            }}
            disabled={disabled || isSubmitting}
          >
            Create account
          </button>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          {mode === "login" ? "Access Simple File Storage" : "Create Your Account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "login"
            ? "Sign in to open your file dashboard and manage your files."
            : "Create an account so you can upload and manage files in your own dashboard."}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete={mode === "login" ? "email" : "username"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-2xl pl-10"
              placeholder="name@example.com"
              disabled={disabled || isSubmitting}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-2xl pl-10"
              placeholder="Enter your password"
              disabled={disabled || isSubmitting}
              required
              minLength={8}
            />
          </div>
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 rounded-2xl pl-10"
                placeholder="Confirm your password"
                disabled={disabled || isSubmitting}
                required
                minLength={8}
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
