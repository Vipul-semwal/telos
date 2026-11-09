import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/state-views";

export default function Loading() {
  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="System"
        title="Loading"
        description="Retrieving workspace state."
      />
      <LoadingState label="Fetching workspace telemetry…" />
    </div>
  );
}
