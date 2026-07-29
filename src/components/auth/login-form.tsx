import * as React from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabaseClient";

const PENDING_SIGNUP_STORAGE_KEY = `bot-drive-pending-signup:${env.supabaseProjectRef ?? "default"}`;
const SIGNUP_RETRY_WINDOW_MS = 60 * 60 * 1000;

type PendingSignup = {
  email: string;
  requestedAt: number;
};

function isEmailRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("over_email_send_rate_limit") ||
    normalizedMessage.includes("email rate limit exceeded")
  );
}

function readPendingSignup() {
  try {
    const storedValue = window.sessionStorage.getItem(PENDING_SIGNUP_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const pendingSignup = JSON.parse(storedValue) as Partial<PendingSignup>;
    if (
      typeof pendingSignup.email !== "string" ||
      typeof pendingSignup.requestedAt !== "number"
    ) {
      return null;
    }

    return pendingSignup as PendingSignup;
  } catch {
    return null;
  }
}

function rememberPendingSignup(email: string) {
  try {
    window.sessionStorage.setItem(
      PENDING_SIGNUP_STORAGE_KEY,
      JSON.stringify({ email, requestedAt: Date.now() } satisfies PendingSignup),
    );
  } catch {
    // Session storage may be unavailable in privacy-restricted browsers.
  }
}

function formatAuthErrorMessage(error: unknown, mode: "login" | "signup") {
  const fallbackMessage =
    error instanceof Error ? error.message : "Authentication failed.";
  const normalizedMessage = fallbackMessage.toLowerCase();

  if (isEmailRateLimitError(error)) {
    return mode === "signup"
      ? "The confirmation email service has reached its temporary sending limit. Use the newest confirmation email in your inbox or spam folder, or wait up to one hour before trying again."
      : "Too many sign-in attempts were made. Please wait a bit and try again.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("err_name_not_resolved")
  ) {
    return "Unable to reach Supabase. Check the project URL, use the public anon key from the same project, and verify your internet/DNS connection.";
  }

  return fallbackMessage;
}

export function LoginForm({ disabled }: { disabled?: boolean }) {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      const pendingSignup = readPendingSignup();
      const isRecentRequest =
        pendingSignup?.email === normalizedEmail &&
        Date.now() - pendingSignup.requestedAt < SIGNUP_RETRY_WINDOW_MS;

      if (isRecentRequest) {
        const pendingMessage =
          "A confirmation request is already pending for this email. Open the newest GCC BOT Drive message in your inbox or spam folder, then confirm your account.";

        setMode("login");
        setError(null);
        setNotice(pendingMessage);
        setPassword("");
        setConfirmPassword("");
        toast.info("Confirmation already requested. Check your email.");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: env.authRedirectUrl,
            data: {
              application_name: "GCC BOT Drive",
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        setMode("login");
        setPassword("");
        setConfirmPassword("");

        const successMessage = data.session
          ? "Account created. You can now access BOT Drive."
          : `Confirmation sent to ${normalizedEmail}. Open the email to activate your account.`;

        if (!data.session) {
          rememberPendingSignup(normalizedEmail);
        }

        setNotice(successMessage);
        toast.success(successMessage);
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
      if (mode === "signup" && isEmailRateLimitError(submitError)) {
        const pendingMessage =
          "A confirmation request is already pending. Use the newest GCC BOT Drive email in your inbox or spam folder. If no email arrived, wait up to one hour before trying again.";

        rememberPendingSignup(normalizedEmail);
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setError(null);
        setNotice(pendingMessage);
        toast.info("Email limit reached. Check your newest confirmation email.");
        return;
      }

      const message = formatAuthErrorMessage(submitError, mode);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-0 bg-white p-5 sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#111111] pb-5">
        <div className="flex h-11 w-11 items-center justify-center border border-[#111111] bg-[#111111] text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-extrabold uppercase tracking-[-0.03em] text-[#111111]">
            {mode === "login" ? "Account Login" : "Create Account"}
          </p>
          <p className="text-sm text-[#68655e]">
            {mode === "login"
              ? "Sign in to open the storage dashboard"
              : "Create an account to open your own workspace"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-2 gap-1 border-0 bg-[#f2f0ea] p-1">
          <button
            type="button"
            className={`min-h-11 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              mode === "login"
                ? "bg-[#111111] text-white"
                : "bg-white text-[#68655e] hover:bg-[#f2f0ea] hover:text-[#111111]"
            }`}
            onClick={() => {
              setMode("login");
              setError(null);
              setPassword("");
              setConfirmPassword("");
              setIsPasswordVisible(false);
              setIsConfirmPasswordVisible(false);
            }}
            disabled={disabled || isSubmitting}
          >
            Log in
          </button>
          <button
            type="button"
            className={`min-h-11 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              mode === "signup"
                ? "bg-[#111111] text-white"
                : "bg-white text-[#68655e] hover:bg-[#f2f0ea] hover:text-[#111111]"
            }`}
            onClick={() => {
              setMode("signup");
              setError(null);
              setPassword("");
              setConfirmPassword("");
              setIsPasswordVisible(false);
              setIsConfirmPasswordVisible(false);
            }}
            disabled={disabled || isSubmitting}
          >
            Create account
          </button>
        </div>

        <h2 className="mt-7 text-2xl font-extrabold tracking-[-0.04em] text-[#111111] sm:text-3xl">
          {mode === "login" ? "Access GCC BOT File Storage" : "Create Your Account"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#68655e]">
          {mode === "login"
            ? "Sign in to open your file dashboard and manage your files."
            : "Create an account so you can upload and manage files in your own dashboard."}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label className="industrial-label text-[#4f4c46]" htmlFor="email">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68655e]" />
            <Input
              id="email"
              type="email"
              autoComplete={mode === "login" ? "email" : "username"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 border-[#111111] bg-white pl-10 font-mono text-xs"
              placeholder="name@example.com"
              disabled={disabled || isSubmitting}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="industrial-label text-[#4f4c46]" htmlFor="password">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68655e]" />
            <Input
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 border-[#111111] bg-white pl-10 pr-11 font-mono text-xs"
              placeholder="Enter your password"
              disabled={disabled || isSubmitting}
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#68655e] transition hover:bg-[#f2f0ea] hover:text-[#111111]"
              onClick={() => setIsPasswordVisible((value) => !value)}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              disabled={disabled || isSubmitting}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <Label className="industrial-label text-[#4f4c46]" htmlFor="confirm-password">
              Confirm Password
            </Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68655e]" />
              <Input
                id="confirm-password"
                type={isConfirmPasswordVisible ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 border-[#111111] bg-white pl-10 pr-11 font-mono text-xs"
                placeholder="Confirm your password"
                disabled={disabled || isSubmitting}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#68655e] transition hover:bg-[#f2f0ea] hover:text-[#111111]"
                onClick={() => setIsConfirmPasswordVisible((value) => !value)}
                aria-label={
                  isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"
                }
                disabled={disabled || isSubmitting}
              >
                {isConfirmPasswordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="border border-[#d8241f] bg-[#fff5f4] px-4 py-3 text-sm text-[#b91f1b]">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div
            className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
            role="status"
          >
            {notice}
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full border border-[#d8241f] bg-[#d8241f] font-mono text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#b91f1b]"
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
