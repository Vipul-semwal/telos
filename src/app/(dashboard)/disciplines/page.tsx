import { getServerSession } from "@/infrastructure/authentication/session";
import { DisciplinesService, MAX_ACTIVE_DISCIPLINES } from "@/modules/disciplines/service";
import { DisciplinesView } from "@/modules/disciplines/components/disciplines-view";
import type { Discipline } from "@/modules/disciplines/domain/types";

export default async function DisciplinesPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const disciplinesList = await DisciplinesService.list(userId);

  return (
    <DisciplinesView
      initialDisciplines={disciplinesList as Discipline[]}
      maxActive={MAX_ACTIVE_DISCIPLINES}
    />
  );
}
