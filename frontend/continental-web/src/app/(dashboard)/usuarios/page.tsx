import { redirect } from "next/navigation";

import { UserManager } from "@/components/users/user-manager";
import { getSession } from "@/lib/auth/session";

export default async function UsersPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <UserManager />;
}