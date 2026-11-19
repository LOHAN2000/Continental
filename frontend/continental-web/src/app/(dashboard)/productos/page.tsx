import { redirect } from "next/navigation";

import { ProductManager } from "@/components/products/product-manager";

import { getSession } from "@/lib/auth/session";

export default async function ProductsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return <ProductManager user={user} />;
}