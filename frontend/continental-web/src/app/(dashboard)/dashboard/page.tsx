import Link from "next/link";

import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { serverApiFetch } from "@/lib/api/server-api";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import { getSession } from "@/lib/auth/session";

import type {
  DashboardResponse,
  ResumenAlertasResponse,
  ResumenInventarioResponse,
} from "@/types/dashboard";

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    return null;
  }

  if (user.rol === "PROPIETARIO") {
    const response = await serverApiFetch(
      "/api/reportes/dashboard"
    );

    if (!response.ok) {
      throw new Error(
        "No fue posible cargar el dashboard."
      );
    }

    const body =
      (await response.json()) as DashboardResponse;

    const dashboard = body.data;

    return (
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#d90016] to-[#a90012] p-6 text-white shadow-lg shadow-red-950/10 sm:p-8">
          <p className="text-sm font-semibold text-red-100">
            Panel principal
          </p>

          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Bienvenido, {user.nombres}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-red-50 sm:text-base">
            Revisa el inventario, las ventas y las alertas más importantes de Continental.
          </p>
        </section>

        <section
          aria-label="Indicadores principales"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Productos activos"
            value={dashboard.productosActivos}
            description="Productos disponibles en el catálogo."
            tone="dark"
          />

          <StatCard
            label="Stock crítico"
            value={
              dashboard.productosSinStock +
              dashboard.productosConStockMinimo
            }
            description={`${dashboard.productosSinStock} sin stock y ${dashboard.productosConStockMinimo} en mínimo.`}
            tone="red"
          />

          <StatCard
            label="Alertas no leídas"
            value={dashboard.alertasNoLeidas}
            description={`${dashboard.lotesProximosAVencer} lotes próximos a vencer.`}
            tone="yellow"
          />

          <StatCard
            label="Ventas del periodo"
            value={dashboard.cantidadVentas}
            description={formatCurrency(
              dashboard.ingresosPorVentas
            )}
            tone="green"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <StatCard
            label="Ingresos por ventas"
            value={formatCurrency(
              dashboard.ingresosPorVentas
            )}
            tone="green"
          />

          <StatCard
            label="Costo histórico"
            value={formatCurrency(
              dashboard.costoHistoricoVendido
            )}
            tone="yellow"
          />

          <StatCard
            label="Margen bruto estimado"
            value={formatCurrency(
              dashboard.margenBrutoEstimado
            )}
            tone="red"
          />
        </section>

        <QuickActions user={user} />

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#24272a]">
                  Productos críticos
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Productos sin stock o debajo del mínimo.
                </p>
              </div>

              <Link
                href="/inventario?estado=STOCK_MINIMO"
                className="text-sm font-bold text-[#d90016] hover:underline"
              >
                Ver inventario
              </Link>
            </div>

            {dashboard.productosCriticos.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-green-50 px-5 py-8 text-center text-sm font-medium text-green-800">
                No existen productos con stock crítico.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3 font-bold">
                        Producto
                      </th>
                      <th className="pb-3 font-bold">
                        Stock
                      </th>
                      <th className="pb-3 font-bold">
                        Mínimo
                      </th>
                      <th className="pb-3 font-bold">
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.productosCriticos.map(
                      (product) => (
                        <tr
                          key={product.idProducto}
                          className="border-b border-slate-100"
                        >
                          <td className="py-4">
                            <p className="font-semibold text-slate-800">
                              {product.producto}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {product.codigoBarras}
                            </p>
                          </td>

                          <td className="py-4 font-bold">
                            {formatNumber(
                              product.stockActual
                            )}
                          </td>

                          <td className="py-4">
                            {formatNumber(
                              product.stockMinimo
                            )}
                          </td>

                          <td className="py-4">
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-800">
                              {product.estado ===
                                "SIN_STOCK"
                                ? "Sin stock"
                                : "Stock mínimo"}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#24272a]">
                  Ventas recientes
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Últimas operaciones del periodo.
                </p>
              </div>

              <Link
                href="/ventas"
                className="text-sm font-bold text-[#d90016] hover:underline"
              >
                Ver ventas
              </Link>
            </div>

            {dashboard.ventasRecientes.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm font-medium text-slate-600">
                Todavía no existen ventas registradas.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {dashboard.ventasRecientes.map(
                  (sale) => (
                    <div
                      key={sale.idVenta}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          Venta N.° {sale.idVenta}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(sale.fecha)}
                          {" · "}
                          {sale.usuario}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-[#24272a]">
                          {formatCurrency(sale.total)}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-green-700">
                          Margen{" "}
                          {formatCurrency(
                            sale.margenBrutoEstimado
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </article>
        </section>
      </div>
    );
  }

  const [inventoryResponse, alertsResponse] =
    await Promise.all([
      serverApiFetch(
        "/api/inventario/resumen"
      ),
      serverApiFetch(
        "/api/alertas/resumen"
      ),
    ]);

  if (
    !inventoryResponse.ok ||
    !alertsResponse.ok
  ) {
    throw new Error(
      "No fue posible cargar el panel operativo."
    );
  }

  const inventoryBody =
    (await inventoryResponse.json()) as
      ResumenInventarioResponse;

  const alertsBody =
    (await alertsResponse.json()) as
      ResumenAlertasResponse;

  const inventory = inventoryBody.data;
  const alerts = alertsBody.data;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#d90016] to-[#a90012] p-6 text-white shadow-lg shadow-red-950/10 sm:p-8">
        <p className="text-sm font-semibold text-red-100">
          Panel operativo
        </p>

        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Bienvenido, {user.nombres}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-red-50 sm:text-base">
          Consulta productos, registra ventas y revisa las alertas activas.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Productos activos"
          value={inventory.totalProductosActivos}
          tone="dark"
        />

        <StatCard
          label="Productos disponibles"
          value={inventory.productosDisponibles}
          tone="green"
        />

        <StatCard
          label="Stock crítico"
          value={
            inventory.productosSinStock +
            inventory.productosConStockMinimo
          }
          tone="red"
        />

        <StatCard
          label="Alertas activas"
          value={alerts.totalActivas}
          description={`${alerts.noLeidas} pendientes de lectura.`}
          tone="yellow"
        />
      </section>

      <QuickActions user={user} />
    </div>
  );
}