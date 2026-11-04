import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/state-views";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="SYSTEM // TELEMETRY"
        title="LOADING MODULE"
        description="Retrieving state from database..."
      />
      <LoadingState label="FETCHING WORKSPACE TELEMETRY..." />
    </div>
  );
}
