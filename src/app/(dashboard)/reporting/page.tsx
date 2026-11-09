import {
  ChartLine,
  CheckSquare,
  ClockCounterClockwise,
  FolderSimple,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "@/infrastructure/authentication/session";
import { ReportingService } from "@/modules/reporting/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";
import { Muted } from "@/components/ui/typography";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatSecondsToHuman } from "@/shared/utils/duration";

export default async function ReportingPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const report = await ReportingService.getOverviewReport(userId);
  const { totals } = report;

  const maxDailySeconds = Math.max(1, ...report.dailyBreakdown.map((d) => d.trackedSeconds));

  return (
    <div className="space-y-8">
      <PageHeader
        moduleCode="Intelligence"
        title="Reports"
        description="Derived performance and progress telemetry. Time aggregates upward from tasks to projects to disciplines, with no duplicated static totals."
        badge={<Badge variant="neutral">Derived engine</Badge>}
      />

      {totals.taskCount === 0 && totals.sessionCount === 0 ? (
        <EmptyState
          kicker="No data yet"
          title="Reports build themselves"
          description="Reports are computed on demand from immutable session records and task completions. Create tasks and record work to populate telemetry."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card variant="glass" className="space-y-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                <ClockCounterClockwise size={16} />
              </span>
              <div className="space-y-0.5">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  Total tracked
                </p>
                <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                  {formatSecondsToHuman(totals.trackedSeconds)}
                </span>
                <span className="text-caption text-foreground-muted">
                  {totals.sessionCount} sessions
                </span>
              </div>
            </Card>

            <Card variant="glass" className="space-y-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-status-success/10 text-status-success">
                <CheckSquare size={16} />
              </span>
              <div className="space-y-0.5">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  Task completion
                </p>
                <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                  {totals.completedTaskCount} / {totals.taskCount}
                </span>
                <span className="text-caption text-foreground-muted">
                  {totals.openTaskCount} open
                </span>
              </div>
            </Card>

            <Card variant="glass" className="space-y-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-status-warning/10 text-status-warning">
                <FolderSimple size={16} />
              </span>
              <div className="space-y-0.5">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  Active structure
                </p>
                <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                  {totals.disciplineCount} / {totals.projectCount}
                </span>
                <span className="text-caption text-foreground-muted">disciplines / projects</span>
              </div>
            </Card>

            <Card variant="glass" className="space-y-3">
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg ${
                  totals.overtimeTaskCount > 0
                    ? "bg-status-error/10 text-status-error"
                    : "bg-surface-hover text-foreground-muted"
                }`}
              >
                <WarningCircle size={16} />
              </span>
              <div className="space-y-0.5">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  ETA overruns
                </p>
                <span
                  className={`block font-mono text-title font-semibold tabular-nums ${
                    totals.overtimeTaskCount > 0
                      ? "text-status-error"
                      : "text-foreground-primary"
                  }`}
                >
                  {totals.overtimeTaskCount}
                </span>
                <span className="text-caption text-foreground-muted">tasks over estimate</span>
              </div>
            </Card>
          </div>

          <Card variant="surface" className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-heading font-semibold text-foreground-primary">
                  Daily tracked time
                </h2>
                <Muted className="text-caption">Working sessions per day.</Muted>
              </div>
              <Badge variant="neutral">Last 14 days</Badge>
            </div>

            <div className="flex h-36 items-end justify-between gap-1.5 border-b border-separator/[0.08] pb-1">
              {report.dailyBreakdown.map((day) => (
                <div
                  key={day.date}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="font-mono text-micro tabular-nums text-foreground-muted">
                    {day.trackedSeconds > 0 ? formatSecondsToHuman(day.trackedSeconds) : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      day.trackedSeconds > 0
                        ? "bg-accent hover:bg-accent-hover"
                        : "bg-surface-hover"
                    }`}
                    style={{
                      height: `${Math.max(3, (day.trackedSeconds / maxDailySeconds) * 100)}%`,
                    }}
                    title={`${day.date}: ${formatSecondsToHuman(day.trackedSeconds)}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between font-mono text-micro text-foreground-muted">
              <span>{report.dailyBreakdown[0]?.date}</span>
              <span>{report.dailyBreakdown[report.dailyBreakdown.length - 1]?.date}</span>
            </div>
          </Card>

          <section className="space-y-3">
            <h2 className="text-heading font-semibold text-foreground-primary">
              Discipline breakdown
            </h2>
            <div className="surface-panel overflow-hidden rounded-2xl px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Tracked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.disciplineBreakdown.map((discipline) => (
                    <TableRow key={discipline.id}>
                      <TableCell className="text-small font-medium text-foreground-primary">
                        {discipline.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={discipline.status === "active" ? "accent" : "neutral"}>
                          {discipline.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-caption tabular-nums text-foreground-secondary">
                        {discipline.activeProjectCount} active / {discipline.projectCount}
                      </TableCell>
                      <TableCell className="font-mono text-caption tabular-nums text-foreground-secondary">
                        {discipline.completedTaskCount} done / {discipline.taskCount}
                      </TableCell>
                      <TableCell className="font-mono text-small tabular-nums text-foreground-primary">
                        {formatSecondsToHuman(discipline.trackedSeconds)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.disciplineBreakdown.length === 0 && (
                    <TableRow>
                      <TableCell className="text-small text-foreground-muted" colSpan={5}>
                        No disciplines defined.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-heading font-semibold text-foreground-primary">
              Project breakdown
            </h2>
            <div className="surface-panel overflow-hidden rounded-2xl px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Tracked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.projectBreakdown.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="text-small font-medium text-foreground-primary">
                        {project.title}
                      </TableCell>
                      <TableCell className="text-caption text-foreground-secondary">
                        {project.disciplineTitle}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            project.status === "active"
                              ? "accent"
                              : project.status === "completed"
                                ? "success"
                                : project.status === "paused"
                                  ? "warning"
                                  : "neutral"
                          }
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-caption tabular-nums text-foreground-secondary">
                        {project.completedTaskCount} done / {project.taskCount}
                      </TableCell>
                      <TableCell className="font-mono text-small tabular-nums text-foreground-primary">
                        {formatSecondsToHuman(project.trackedSeconds)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.projectBreakdown.length === 0 && (
                    <TableRow>
                      <TableCell className="text-small text-foreground-muted" colSpan={5}>
                        No projects defined.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
