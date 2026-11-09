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
    <div className="space-y-7">
      <PageHeader
        moduleCode="System"
        title="Something went wrong"
        description="An unexpected fault occurred while loading this view."
      />
      <ErrorState
        title="Runtime fault"
        message={error.message || "An unhandled exception occurred."}
        onRetry={() => reset()}
      />
    </div>
  );
}
