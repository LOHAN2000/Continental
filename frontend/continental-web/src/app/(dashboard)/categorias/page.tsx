import { redirect } from "next/navigation";

import { CategoryManager } from "@/components/categories/category-manager";

import { getSession } from "@/lib/auth/session";

export default async function CategoriesPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.rol !== "PROPIETARIO") {
    redirect("/dashboard");
  }

  return <CategoryManager />;
}