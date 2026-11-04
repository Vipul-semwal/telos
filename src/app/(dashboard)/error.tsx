"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/state-views";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="SYSTEM // FAULT"
        title="SYSTEM ERROR"
        description="An unexpected fault occurred in the dashboard subsystem."
      />
      <ErrorState
        title="APPLICATION RUNTIME FAULT"
        message={error.message || "An unhandled exception occurred."}
        onRetry={() => reset()}
      />
    </div>
  );
}
