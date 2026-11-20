import { redirect } from "next/navigation";

import { AlertManager } from "@/components/alerts/alert-manager";
import { getSession } from "@/lib/auth/session";

export default async function AlertsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <AlertManager user={user} />;
}