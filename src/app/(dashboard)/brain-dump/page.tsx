import { getServerSession } from "@/infrastructure/authentication/session";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";

export default async function BrainDumpPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const items = await BrainDumpService.list(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 06 // CAPTURE"
        title="BRAIN DUMP"
        description="Frictionless capture inbox for raw, unclassified thoughts awaiting triage or conversion into projects, tasks, or subtasks."
        badge={<Badge variant="neutral">{items.length} IN INBOX</Badge>}
      />

      <EmptyState
        kicker="CAPTURE // INBOX READY"
        title="RAW INBOX SUBSYSTEM"
        description="Items captured here remain unclassified until triaged. Conversion tracking preserves original capture lifecycle records."
      />
    </div>
  );
}
