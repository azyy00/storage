import * as React from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import collegeLogo from "../../Logo.png";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { useAuth } from "@/providers/auth-provider";

export function LoginPage() {
  const { user, isLoading, isConfigured } = useAuth();

  React.useEffect(() => {
    document.title = "GCC BOT File Storage";
  }, []);

  if (isConfigured && !isLoading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="theme min-h-screen bg-[#f5f7fb] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="flex w-full max-w-md flex-col items-center gap-4 sm:gap-5">
          <div className="flex flex-col items-center text-center">
            <img
              src={collegeLogo}
              alt="Goa Community College logo"
              className="h-20 w-20 rounded-full border border-slate-200 bg-white object-cover shadow-sm sm:h-24 sm:w-24"
            />
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Goa Community College
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              GCC BOT File Storage
            </p>
          </div>

          {!env.isSupabaseConfigured ? (
            <Card className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Supabase configuration required
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-950/80">
                    Add <code>VITE_SUPABASE_URL</code> and{" "}
                    <code>VITE_SUPABASE_ANON_KEY</code> to your environment
                    before signing in.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <LoginForm disabled={!env.isSupabaseConfigured} />
        </div>
      </div>
    </div>
  );
}
