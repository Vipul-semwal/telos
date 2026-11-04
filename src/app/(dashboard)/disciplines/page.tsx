import { getServerSession } from "@/infrastructure/authentication/session";
import { DisciplinesService, MAX_ACTIVE_DISCIPLINES } from "@/modules/disciplines/service";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function DisciplinesPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const disciplinesList = await DisciplinesService.list(userId);
  const activeCount = disciplinesList.filter((d) => d.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 03 // PURSUITS
          </span>
          <H1>DISCIPLINES</H1>
          <Muted>Areas of sustained pursuit. Maximum {MAX_ACTIVE_DISCIPLINES} active disciplines per user.</Muted>
        </div>
        <Badge variant={activeCount >= MAX_ACTIVE_DISCIPLINES ? "warning" : "neutral"}>
          {activeCount} / {MAX_ACTIVE_DISCIPLINES} ACTIVE
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {disciplinesList.length === 0 ? (
          <div className="col-span-full border border-dashed border-border p-8 text-center rounded-sm">
            <p className="font-mono text-xs text-foreground-secondary mb-1">NO ACTIVE DISCIPLINES</p>
            <Muted>Discipline management module foundation is active and ready for entries.</Muted>
          </div>
        ) : (
          disciplinesList.map((d) => (
            <Card key={d.id} variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{d.title}</CardTitle>
                  <Badge variant={d.status === "active" ? "accent" : "neutral"}>{d.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground-secondary">{d.description || "No description provided."}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
