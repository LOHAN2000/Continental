import { redirect } from "next/navigation";

import { AdjustmentManager } from "@/components/adjustments/adjustment-manager";
import { getSession } from "@/lib/auth/session";

export default async function AdjustmentsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <AdjustmentManager />;
}