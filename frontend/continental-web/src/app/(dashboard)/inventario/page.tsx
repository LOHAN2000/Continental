import { redirect } from "next/navigation";

import { InventoryManager } from "@/components/inventory/inventory-manager";
import { getSession } from "@/lib/auth/session";

export default async function InventoryPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <InventoryManager />;
}