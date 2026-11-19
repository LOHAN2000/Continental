"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { StatCard } from "@/components/dashboard/stat-card";
import { readApiResponse } from "@/lib/api/read-response";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import type {
  CategoriesResponse,
} from "@/types/categories";
import type {
  InventoryItem,
  InventoryResponse,
  InventoryStatus,
  InventorySummary,
  InventorySummaryResponse,
  KardexResponse,
  ProductKardex,
} from "@/types/inventory";

type InventoryFilters = {
  search: string;
  idCategoria: number;
  estado: InventoryStatus | "";
  includeInactive: boolean;
};

const initialFilters: InventoryFilters = {
  search: "",
  idCategoria: 0,
  estado: "",
  includeInactive: false,
};

const statusLabels: Record<InventoryStatus, string> = {
  SIN_STOCK: "Sin stock",
  STOCK_MINIMO: "Stock mínimo",
  DISPONIBLE: "Disponible",
};

function MovementBadge({
  type,
}: {
  type: string;
}) {
  const labels: Record<string, string> = {
    COMPRA: "Compra",
    VENTA: "Venta",
    AJUSTE_ENTRADA: "Ajuste de entrada",
    AJUSTE_SALIDA: "Ajuste de salida",
  };

  const entry =
    type === "COMPRA" ||
    type === "AJUSTE_ENTRADA";

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        entry
          ? "bg-green-50 text-green-800"
          : "bg-red-50 text-red-800",
      ].join(" ")}
    >
      {labels[type] ?? type}
    </span>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function StateMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-600">
      {text}
    </div>
  );
}

function InventoryStatusBadge({
  status,
}: {
  status: InventoryStatus;
}) {
  const styles: Record<InventoryStatus, string> = {
    SIN_STOCK: "bg-red-50 text-red-800",
    STOCK_MINIMO: "bg-amber-50 text-amber-900",
    DISPONIBLE: "bg-green-50 text-green-800",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        styles[status],
      ].join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value
    .slice(0, 10)
    .split("-");

  return `${day}/${month}/${year}`;
}

export function InventoryManager() {
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<
    CategoriesResponse["data"]
  >([]);
  const [summary, setSummary] =
    useState<InventorySummary | null>(null);
  const [filters, setFilters] =
    useState<InventoryFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);
  const [kardex, setKardex] =
    useState<ProductKardex | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isLoadingKardex, setIsLoadingKardex] =
    useState(false);

  async function loadInventory(
    selectedFilters: InventoryFilters
  ) {
    setIsLoading(true);

    const query = new URLSearchParams({
      includeInactive: String(
        selectedFilters.includeInactive
      ),
    });

    if (selectedFilters.search.trim()) {
      query.set(
        "search",
        selectedFilters.search.trim()
      );
    }

    if (selectedFilters.idCategoria) {
      query.set(
        "idCategoria",
        String(selectedFilters.idCategoria)
      );
    }

    if (selectedFilters.estado) {
      query.set("estado", selectedFilters.estado);
    }

    try {
      const response = await fetch(
        `/api/inventory?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<InventoryResponse>(
          response,
          "No fue posible consultar el inventario."
        );

      setItems(body.data);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar el inventario."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSummary() {
    try {
      const response = await fetch(
        "/api/inventory/summary",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<InventorySummaryResponse>(
          response,
          "No fue posible cargar el resumen del inventario."
        );

      setSummary(body.data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el resumen del inventario."
      );
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch(
        "/api/categories?includeInactive=false",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<CategoriesResponse>(
          response,
          "No fue posible cargar las categorías."
        );

      setCategories(body.data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las categorías."
      );
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInventory(initialFilters);
    void loadSummary();
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void loadInventory(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    void loadInventory(initialFilters);
  }

  async function fetchKardex(
    idProducto: number,
    startDate: string,
    endDate: string
  ) {
    setIsLoadingKardex(true);
    setKardex(null);

    const query = new URLSearchParams();
    if (startDate) {
      query.set("fechaInicio", startDate);
    }
    if (endDate) {
      query.set("fechaFin", endDate);
    }

    const queryString = query.toString();
    const suffix = queryString
      ? `?${queryString}`
      : "";

    try {
      const response = await fetch(
        `/api/inventory/${idProducto}/kardex${suffix}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<KardexResponse>(
          response,
          "No fue posible consultar el Kardex."
        );

      setKardex(body.data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar el Kardex."
      );
    } finally {
      setIsLoadingKardex(false);
    }
  }

  function openKardex(item: InventoryItem) {
    setSelectedItem(item);
    setFechaInicio("");
    setFechaFin("");
    void fetchKardex(item.idProducto, "", "");
  }

  function handleKardexSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      fechaInicio &&
      fechaFin &&
      fechaInicio > fechaFin
    ) {
      setMessage(
        "La fecha de inicio no puede ser posterior a la fecha final."
      );
      return;
    }

    if (selectedItem) {
      void fetchKardex(
        selectedItem.idProducto,
        fechaInicio,
        fechaFin
      );
    }
  }

  function closeKardex() {
    setSelectedItem(null);
    setKardex(null);
    setFechaInicio("");
    setFechaFin("");
  }

  const summaryCards = summary
    ? [
        {
          label: "Productos activos",
          value: formatNumber(
            summary.totalProductosActivos
          ),
          tone: "dark" as const,
        },
        {
          label: "Sin stock",
          value: formatNumber(
            summary.productosSinStock
          ),
          tone: "red" as const,
        },
        {
          label: "Stock mínimo",
          value: formatNumber(
            summary.productosConStockMinimo
          ),
          tone: "yellow" as const,
        },
        {
          label: "Disponibles",
          value: formatNumber(
            summary.productosDisponibles
          ),
          tone: "green" as const,
        },
        {
          label: "Unidades disponibles",
          value: formatNumber(
            summary.unidadesDisponibles
          ),
          tone: "dark" as const,
        },
        {
          label: "Valor a costo",
          value: formatCurrency(
            summary.valorInventarioCosto
          ),
          tone: "dark" as const,
        },
        {
          label: "Valor a venta",
          value: formatCurrency(
            summary.valorInventarioVenta
          ),
          tone: "green" as const,
        },
      ]
    : [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
          Continental
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
          Inventario
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Consulta existencias, niveles de stock y movimientos por producto.
        </p>
      </div>

      {message && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
        >
          {message}
        </div>
      )}

      {summary && (
        <section
          aria-label="Resumen del inventario"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              tone={card.tone}
            />
          ))}
        </section>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_220px_200px_auto_auto]"
        >
          <FormField
            label="Buscar producto"
            htmlFor="inventory-search"
          >
            <input
              id="inventory-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  search: event.target.value,
                })
              }
              placeholder="Nombre o código..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            />
          </FormField>

          <FormField
            label="Categoría"
            htmlFor="inventory-category"
          >
            <select
              id="inventory-category"
              value={filters.idCategoria}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  idCategoria: Number(event.target.value),
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            >
              <option value={0}>Todas las categorías</option>
              {categories.map((category) => (
                <option
                  key={category.idCategoria}
                  value={category.idCategoria}
                >
                  {category.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Estado de stock"
            htmlFor="inventory-status"
          >
            <select
              id="inventory-status"
              value={filters.estado}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  estado: event.target.value as
                    | InventoryStatus
                    | "",
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Todos</option>
              <option value="SIN_STOCK">Sin stock</option>
              <option value="STOCK_MINIMO">Stock mínimo</option>
              <option value="DISPONIBLE">Disponible</option>
            </select>
          </FormField>

          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={filters.includeInactive}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  includeInactive: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-400 accent-[#d90016]"
            />
            Incluir inactivos
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 rounded-xl bg-[#d90016] px-4 font-bold text-white transition hover:bg-[#a90012] disabled:opacity-60"
            >
              {isLoading ? "Buscando…" : "Filtrar"}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={isLoading}
              className="h-10 rounded-xl border border-slate-300 px-4 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Limpiar
            </button>
          </div>
        </form>

        {isLoading ? (
          <StateMessage text="Cargando inventario…" />
        ) : items.length === 0 ? (
          <StateMessage text="No se encontraron productos para estos filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                  <th className="px-5 py-3 font-bold">
                    Producto
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Categoría
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Stock
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Mínimo
                  </th>
                  <th className="px-5 py-3 text-center font-bold">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Lotes
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Próximo vencimiento
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Kardex
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.idProducto}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.producto}
                        {!item.activo && (
                          <span className="ml-2 text-xs font-bold text-slate-700">
                            (Inactivo)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {item.codigoBarras}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {item.categoria}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatNumber(item.stockActual)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      {formatNumber(item.stockMinimo)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <InventoryStatusBadge
                        status={item.estadoStock}
                      />
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      {formatNumber(item.cantidadEnLotes)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {item.controlaVencimiento
                        ? item.proximoVencimiento
                          ? formatDateOnly(
                              item.proximoVencimiento
                            )
                          : "Sin vencimiento próximo"
                        : "No aplica"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openKardex(item)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                      >
                        Ver Kardex
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kardex-title"
            className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#d90016]">
                  Kardex del producto
                </p>
                <h3
                  id="kardex-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {kardex?.producto ?? selectedItem.producto}
                </h3>
                <p className="mt-1 font-mono text-sm text-slate-700">
                  {kardex?.codigoBarras ??
                    selectedItem.codigoBarras}
                </p>
              </div>
              <button
                type="button"
                onClick={closeKardex}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <form
              onSubmit={handleKardexSubmit}
              className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4"
            >
              <FormField
                label="Fecha de inicio"
                htmlFor="kardex-start-date"
              >
                <input
                  id="kardex-start-date"
                  type="date"
                  value={fechaInicio}
                  onChange={(event) =>
                    setFechaInicio(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
                />
              </FormField>
              <FormField
                label="Fecha final"
                htmlFor="kardex-end-date"
              >
                <input
                  id="kardex-end-date"
                  type="date"
                  value={fechaFin}
                  onChange={(event) =>
                    setFechaFin(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
                />
              </FormField>
              <button
                type="submit"
                disabled={isLoadingKardex}
                className="h-10 rounded-xl bg-slate-800 px-4 font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {isLoadingKardex
                  ? "Consultando…"
                  : "Aplicar fechas"}
              </button>
            </form>

            {isLoadingKardex ? (
              <StateMessage text="Consultando movimientos…" />
            ) : kardex ? (
              <>
                <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800">
                  <span className="font-semibold">
                    Stock actual:
                  </span>
                  <span className="ml-2 font-bold text-slate-900">
                    {formatNumber(kardex.stockActual)}
                  </span>
                </div>

                {kardex.movimientos.length === 0 ? (
                  <StateMessage text="No hay movimientos para el período seleccionado." />
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[980px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                          <th className="px-4 py-3 font-bold">
                            Fecha
                          </th>
                          <th className="px-4 py-3 font-bold">
                            Movimiento
                          </th>
                          <th className="px-4 py-3 font-bold">
                            Usuario
                          </th>
                          <th className="px-4 py-3 font-bold">
                            Referencia
                          </th>
                          <th className="px-4 py-3 text-right font-bold">
                            Entrada
                          </th>
                          <th className="px-4 py-3 text-right font-bold">
                            Salida
                          </th>
                          <th className="px-4 py-3 text-right font-bold">
                            Saldo
                          </th>
                          <th className="px-4 py-3 font-bold">
                            Motivo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {kardex.movimientos.map(
                          (movement) => (
                            <tr
                              key={movement.idMovimiento}
                              className="border-b border-slate-200 last:border-0 text-slate-900"
                            >
                              <td className="px-4 py-3 whitespace-nowrap font-medium">
                                {formatDateTime(
                                  movement.fecha
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <MovementBadge
                                  type={movement.tipo}
                                />
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {movement.usuario}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {movement.referenciaId
                                  ? `#${movement.referenciaId}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-green-800">
                                {movement.entrada
                                  ? formatNumber(
                                      movement.entrada
                                    )
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-red-800">
                                {movement.salida
                                  ? formatNumber(
                                      movement.salida
                                    )
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                {formatNumber(
                                  movement.saldo
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {movement.motivo ?? "—"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <StateMessage text="No fue posible cargar el Kardex." />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
