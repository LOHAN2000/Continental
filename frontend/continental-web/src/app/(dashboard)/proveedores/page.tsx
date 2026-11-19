import { redirect } from "next/navigation";

import { ProviderManager } from "@/components/providers/provider-manager";

import { getSession } from "@/lib/auth/session";

export default async function ProvidersPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <ProviderManager />;
}