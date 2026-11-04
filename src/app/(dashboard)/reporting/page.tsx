import { getServerSession } from "@/infrastructure/authentication/session";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export default async function ReportingPage() {
  const session = await getServerSession();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 08 // INTELLIGENCE
          </span>
          <H1>REPORTING & METRICS</H1>
          <Muted>Derived directly from underlying task sessions. Task ? Project ? Discipline aggregation.</Muted>
        </div>
        <Badge variant="neutral">DERIVED ENGINE</Badge>
      </div>

      <div className="border border-dashed border-border p-8 text-center rounded-sm">
        <p className="font-mono text-xs text-foreground-secondary mb-1">AGGREGATION PIPELINE ACTIVE</p>
        <Muted>Zero duplicated totals; metrics derived on-demand from verified session history.</Muted>
      </div>
    </div>
  );
}
