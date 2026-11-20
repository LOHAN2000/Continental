import { redirect } from "next/navigation";

import { ReportManager } from "@/components/reports/report-manager";
import { getSession } from "@/lib/auth/session";

export default async function ReportsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <ReportManager />;
}