import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChartLine, CheckCircle, Clock, Repeat } from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "@/infrastructure/authentication/session";
import { RoutineService } from "@/modules/routines/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSecondsToHuman } from "@/shared/utils/duration";

function statusVariant(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "planned") return "accent" as const;
  if (status === "skipped") return "warning" as const;
  if (status === "missed" || status === "blocked") return "error" as const;
  return "neutral" as const;
}

export default async function RoutineReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  const userId = session!.user.id;
  const { id } = await params;
  const report = await RoutineService.getReport(userId, id);

  if (!report) notFound();

  const adherencePercent = Math.round(report.totals.adherenceRate * 100);

  return (
    <div className="space-y-7">
      <Link
        href="/routines"
        className="inline-flex items-center gap-1.5 text-caption font-medium text-foreground-secondary transition-colors hover:text-foreground-primary"
      >
        <ArrowLeft size={14} />
        Back to routines
      </Link>

      <PageHeader
        moduleCode={`${report.routine.projectTitle} / Routine`}
        title={`${report.routine.title} report`}
        description="Occurrence-level history, actual tracked time, planned time, and adherence across every generated routine day."
        badge={
          <Badge variant={report.routine.status === "active" ? "success" : "neutral"}>
            {report.routine.status}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card variant="glass" className="space-y-2">
          <Clock size={17} className="text-accent" />
          <p className="text-caption text-foreground-muted">Total actual time</p>
          <p className="font-mono text-title font-semibold tabular-nums text-foreground-primary">
            {formatSecondsToHuman(report.totals.totalActualSeconds)}
          </p>
          <p className="text-caption text-foreground-muted">
            {report.totals.sessionCount} tracked sessions
          </p>
        </Card>
        <Card variant="glass" className="space-y-2">
          <Repeat size={17} className="text-status-warning" />
          <p className="text-caption text-foreground-muted">Total planned time</p>
          <p className="font-mono text-title font-semibold tabular-nums text-foreground-primary">
            {formatSecondsToHuman(report.totals.totalPlannedSeconds)}
          </p>
          <p className="text-caption text-foreground-muted">
            Across {report.totals.occurrenceCount} occurrences
          </p>
        </Card>
        <Card variant="glass" className="space-y-2">
          <CheckCircle size={17} className="text-status-success" />
          <p className="text-caption text-foreground-muted">Completed</p>
          <p className="font-mono text-title font-semibold tabular-nums text-foreground-primary">
            {report.totals.completedCount} / {report.totals.occurrenceCount}
          </p>
          <p className="text-caption text-foreground-muted">
            {report.totals.skippedCount} skipped · {report.totals.missedCount} missed
          </p>
        </Card>
        <Card variant="glass" className="space-y-2">
          <ChartLine size={17} className="text-accent" />
          <p className="text-caption text-foreground-muted">Adherence</p>
          <p className="font-mono text-title font-semibold tabular-nums text-foreground-primary">
            {adherencePercent}%
          </p>
          <p className="text-caption text-foreground-muted">
            Completed / generated occurrences
          </p>
        </Card>
      </div>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="text-subheading font-semibold text-foreground-primary">
          Weekly schedule
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {report.schedule.map((variant) => (
            <div
              key={variant.taskId}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-raised/45 px-3 py-2.5"
            >
              <div>
                <p className="text-caption font-medium text-foreground-muted">
                  {variant.weekdayLabel}
                </p>
                <p className="text-small font-medium text-foreground-primary">
                  {variant.title}
                </p>
              </div>
              <span className="font-mono text-caption tabular-nums text-foreground-secondary">
                {formatSecondsToHuman(variant.plannedDurationSeconds)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-heading font-semibold text-foreground-primary">
          Weekday summary
        </h2>
        <div className="surface-panel overflow-hidden rounded-2xl px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Weekday</TableHead>
                <TableHead>Occurrences</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.weekdayBreakdown.map((day) => (
                <TableRow key={day.weekday}>
                  <TableCell className="text-small font-medium text-foreground-primary">
                    {day.weekdayLabel}
                  </TableCell>
                  <TableCell className="font-mono text-caption tabular-nums">
                    {day.occurrenceCount}
                  </TableCell>
                  <TableCell className="font-mono text-caption tabular-nums">
                    {day.completedCount}
                  </TableCell>
                  <TableCell className="font-mono text-caption tabular-nums">
                    {formatSecondsToHuman(day.plannedDurationSeconds)}
                  </TableCell>
                  <TableCell className="font-mono text-small tabular-nums text-foreground-primary">
                    {formatSecondsToHuman(day.actualDurationSeconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-heading font-semibold text-foreground-primary">
              Full occurrence history
            </h2>
            <p className="text-caption text-foreground-muted">
              Every generated date, exercise, planned duration, actual time, and status.
            </p>
          </div>
          <Badge variant="neutral">{report.occurrences.length} rows</Badge>
        </div>

        {report.occurrences.length === 0 ? (
          <EmptyState
            kicker="No occurrences"
            title="No routine days have been generated yet"
            description="The first matching weekday after the routine start date will create the first history row."
          />
        ) : (
          <div className="surface-panel overflow-x-auto rounded-2xl px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weekday</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.occurrences.map((occurrence) => (
                  <TableRow key={occurrence.id}>
                    <TableCell className="font-mono text-caption tabular-nums text-foreground-secondary">
                      {occurrence.localDate}
                    </TableCell>
                    <TableCell className="text-caption text-foreground-secondary">
                      {occurrence.weekdayLabel}
                    </TableCell>
                    <TableCell className="text-small font-medium text-foreground-primary">
                      {occurrence.taskTitle}
                    </TableCell>
                    <TableCell className="font-mono text-caption tabular-nums">
                      {formatSecondsToHuman(occurrence.plannedDurationSeconds)}
                    </TableCell>
                    <TableCell className="font-mono text-small tabular-nums text-foreground-primary">
                      {formatSecondsToHuman(occurrence.actualDurationSeconds)}
                    </TableCell>
                    <TableCell className="font-mono text-caption tabular-nums">
                      {occurrence.sessionCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(occurrence.effectiveStatus)}>
                        {occurrence.effectiveStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
