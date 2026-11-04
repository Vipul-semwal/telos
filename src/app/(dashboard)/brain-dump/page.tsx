import { getServerSession } from "@/infrastructure/authentication/session";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export default async function BrainDumpPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const items = await BrainDumpService.list(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 06 // CAPTURE
          </span>
          <H1>BRAIN DUMP</H1>
          <Muted>Unclassified ideas and captures. Can be converted into projects, tasks, or subtasks.</Muted>
        </div>
        <Badge variant="neutral">{items.length} IN INBOX</Badge>
      </div>

      <div className="border border-dashed border-border p-8 text-center rounded-sm">
        <p className="font-mono text-xs text-foreground-secondary mb-1">BRAIN DUMP INBOX ACTIVE</p>
        <Muted>Capture pipeline and conversion schema operational.</Muted>
      </div>
    </div>
  );
}
