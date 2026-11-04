import { redirect } from "next/navigation";
import { getServerSession } from "@/infrastructure/authentication/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as { name?: string; username?: string };
  const displayUsername = user.username || user.name || "Operator";

  return <AppShell username={displayUsername}>{children}</AppShell>;
}
