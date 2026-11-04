import { getServerSession } from "@/infrastructure/authentication/session";
import { DisciplinesService, MAX_ACTIVE_DISCIPLINES } from "@/modules/disciplines/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";

export default async function DisciplinesPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const disciplinesList = await DisciplinesService.list(userId);
  const activeCount = disciplinesList.filter((d) => d.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 03 // PURSUITS"
        title="DISCIPLINES"
        description={`Sustained areas of core pursuit. Strict domain invariant: maximum ${MAX_ACTIVE_DISCIPLINES} active disciplines per user.`}
        badge={
          <Badge variant={activeCount >= MAX_ACTIVE_DISCIPLINES ? "warning" : "neutral"}>
            {activeCount} / {MAX_ACTIVE_DISCIPLINES} ACTIVE
          </Badge>
        }
      />

      {disciplinesList.length === 0 ? (
        <EmptyState
          kicker="DISCIPLINES // STANDBY"
          title="NO DISCIPLINES CONFIGURED"
          description="Disciplines represent areas of sustained pursuit (e.g. Systems Engineering, Physical Optimization). Up to 3 active pursuits may be defined."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {disciplinesList.map((d) => (
            <Card key={d.id} variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="truncate">{d.title}</CardTitle>
                  <Badge variant={d.status === "active" ? "accent" : "neutral"} className="shrink-0">
                    {d.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground-secondary line-clamp-3">
                  {d.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
