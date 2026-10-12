
"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import GetStartedLanding from "@/components/GetStartedLanding";

export default function AuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <GetStartedLanding />;
  }

  return <>{children}</>;
}
