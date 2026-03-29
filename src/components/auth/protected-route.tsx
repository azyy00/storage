import * as React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/providers/auth-provider";

function AuthLoadingScreen() {
  return (
    <div className="theme flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Checking your session...
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isConfigured } = useAuth();

  if (!isConfigured) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
