import { redirect } from "next/navigation";

import { SalesManager } from "@/components/sales/sales-manager";
import { getSession } from "@/lib/auth/session";

export default async function SalesPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <SalesManager user={user} />;
}