import Link from "next/link";

import type { SessionUser } from "@/types/auth";

type QuickActionsProps = {
  user: SessionUser;
};

export function QuickActions({
  user,
}: QuickActionsProps) {
  const actions =
    user.rol === "PROPIETARIO"
      ? [
          {
            label: "Nuevo producto",
            href: "/productos",
            description:
              "Registra o administra el catálogo.",
          },
          {
            label: "Registrar compra",
            href: "/compras",
            description:
              "Ingresa nueva mercadería.",
          },
          {
            label: "Nueva venta",
            href: "/ventas",
            description:
              "Registra una salida de productos.",
          },
          {
            label: "Ver alertas",
            href: "/alertas",
            description:
              "Revisa stock mínimo y vencimientos.",
          },
        ]
      : [
          {
            label: "Nueva venta",
            href: "/ventas",
            description:
              "Registra una operación de venta.",
          },
          {
            label: "Consultar producto",
            href: "/productos",
            description:
              "Busca precio y disponibilidad.",
          },
          {
            label: "Ver inventario",
            href: "/inventario",
            description:
              "Consulta las existencias actuales.",
          },
          {
            label: "Ver alertas",
            href: "/alertas",
            description:
              "Consulta las alertas activas.",
          },
        ];

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#24272a]">
          Acciones rápidas
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Accede a las operaciones utilizadas con mayor frecuencia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 font-black text-[#d90016] transition group-hover:bg-[#d90016] group-hover:text-white">
              →
            </div>

            <p className="mt-4 font-bold text-[#24272a]">
              {action.label}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}