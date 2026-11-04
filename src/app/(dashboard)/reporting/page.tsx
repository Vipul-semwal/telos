import { getServerSession } from "@/infrastructure/authentication/session";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";

export default async function ReportingPage() {
  const session = await getServerSession();

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 08 // INTELLIGENCE"
        title="REPORTS & ANALYTICS"
        description="Derived performance and progress telemetry. Time aggregates strictly upward: Task ? Project ? Discipline. Zero duplicated static totals."
        badge={<Badge variant="neutral">DERIVED ENGINE</Badge>}
      />

      <EmptyState
        kicker="ANALYTICS // PIPELINE READY"
        title="EMPIRICAL REPORTING ENGINE"
        description="Reports are computed on-demand from underlying immutable session records and task completions."
      />
    </div>
  );
}
