import { redirect } from "next/navigation";

import { PurchaseManager } from "@/components/purchases/purchase-manager";
import { getSession } from "@/lib/auth/session";

export default async function PurchasesPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <PurchaseManager />;
}