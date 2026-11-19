import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";

import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <AdminShell user={user}>
      {children}
    </AdminShell>
  );
}