import { redirect } from "next/navigation";

import { BatchManager } from "@/components/batches/batch-manager";
import { getSession } from "@/lib/auth/session";

export default async function BatchesPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <BatchManager />;
}