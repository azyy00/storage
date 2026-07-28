import * as React from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

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
    <main className="industrial-ui industrial-noise theme flex min-h-screen w-full max-w-full items-center justify-center overflow-x-hidden bg-[#f2f0ea] p-4 text-[#111111] sm:p-8">
      <section className="flex w-full max-w-lg flex-col justify-center">
          {!env.isSupabaseConfigured ? (
            <Card className="mb-5 border border-[#d8241f] bg-[#fff5f4] px-5 py-4 text-[#991b17]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-[#d8241f] bg-white text-[#d8241f]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">
                    Supabase configuration required
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {env.supabaseConfigError ??
                      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment before signing in."}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <LoginForm disabled={!env.isSupabaseConfigured} />
      </section>
    </main>
  );
}
