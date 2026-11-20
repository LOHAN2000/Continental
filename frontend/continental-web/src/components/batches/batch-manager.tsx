"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { readApiResponse } from "@/lib/api/read-response";
import {
  formatNumber,
} from "@/lib/formatters";
import type {
  Product,
  ProductsResponse,
} from "@/types/products";
import type {
  Batch,
  BatchesResponse,
  BatchStatus,
} from "@/types/batches";

type BatchFilters = {
  search: string;
  idProducto: string;
  estado: BatchStatus | "";
  onlyAvailable: boolean;
  includeInactive: boolean;
};

const initialFilters: BatchFilters = {
  search: "",
  idProducto: "",
  estado: "",
  onlyAvailable: false,
  includeInactive: false,
};

const statusLabels: Record<BatchStatus, string> = {
  VIGENTE: "Vigente",
  PROXIMO_VENCER: "Próximo a vencer",
  VENCIDO: "Vencido",
  AGOTADO: "Agotado",
};

function DaysBadge({
  days,
}: {
  days: number;
}) {
  if (days < 0) {
    return (
      <span className="font-bold text-red-800">
        Venció hace {Math.abs(days)} día(s)
      </span>
    );
  }

  if (days === 0) {
    return (
      <span className="font-bold text-red-800">
        Vence hoy
      </span>
    );
  }

  return (
    <span
      className={
        days <= 30
          ? "font-bold text-amber-800"
          : "font-semibold text-slate-800"
      }
    >
      {days} día(s)
    </span>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
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
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-700">
      {text}
    </div>
  );
}

function BatchStatusBadge({
  status,
}: {
  status: BatchStatus;
}) {
  const styles: Record<BatchStatus, string> = {
    VIGENTE: "bg-green-50 text-green-800",
    PROXIMO_VENCER: "bg-amber-50 text-amber-900",
    VENCIDO: "bg-red-50 text-red-800",
    AGOTADO: "bg-slate-200 text-slate-800",
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

export function BatchManager() {
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] =
    useState<BatchFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] =
    useState(true);
  const [message, setMessage] = useState("");

  async function loadBatches(
    productId: string,
    onlyAvailable: boolean
  ) {
    setIsLoading(true);

    const query = new URLSearchParams({
      onlyAvailable: String(onlyAvailable),
    });

    if (productId) {
      query.set("idProducto", productId);
    }

    try {
      const response = await fetch(
        `/api/batches?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<BatchesResponse>(
          response,
          "No fue posible consultar los lotes."
        );

      setBatches(body.data);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los lotes."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProducts() {
    setIsLoadingProducts(true);

    try {
      const response = await fetch(
        "/api/products?includeInactive=true",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<ProductsResponse>(
          response,
          "No fue posible cargar los productos."
        );

      setProducts(body.data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los productos."
      );
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBatches("", false);
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBatches = useMemo(() => {
    const normalizedSearch = filters.search
      .trim()
      .toLowerCase();

    return batches.filter((batch) => {
      const matchesSearch =
        !normalizedSearch ||
        batch.producto
          .toLowerCase()
          .includes(normalizedSearch) ||
        batch.codigoBarras
          .toLowerCase()
          .includes(normalizedSearch) ||
        batch.codigoLote
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        !filters.estado ||
        batch.estado === filters.estado;

      const matchesActive =
        filters.includeInactive || batch.activo;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesActive
      );
    });
  }, [
    batches,
    filters.estado,
    filters.includeInactive,
    filters.search,
  ]);

  const availableUnits = useMemo(
    () =>
      filteredBatches.reduce(
        (total, batch) =>
          total + batch.cantidadDisponible,
        0
      ),
    [filteredBatches]
  );

  const expiringSoonCount = useMemo(
    () =>
      filteredBatches.filter(
        (batch) =>
          batch.estado === "PROXIMO_VENCER" ||
          batch.estado === "VENCIDO"
      ).length,
    [filteredBatches]
  );

  function handleFilterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void loadBatches(
      filters.idProducto,
      filters.onlyAvailable
    );
  }

  function clearFilters() {
    setFilters(initialFilters);
    void loadBatches("", false);
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
          Continental
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
          Control de lotes
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Consulta trazabilidad, disponibilidad y fechas de vencimiento.
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

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-800 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Lotes encontrados
          </p>
          <p className="mt-2 text-3xl font-black text-[#24272a]">
            {formatNumber(filteredBatches.length)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 border-l-4 border-l-green-700 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Unidades disponibles
          </p>
          <p className="mt-2 text-3xl font-black text-[#24272a]">
            {formatNumber(availableUnits)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-600 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Próximos a vencer o vencidos
          </p>
          <p className="mt-2 text-3xl font-black text-[#24272a]">
            {formatNumber(expiringSoonCount)}
          </p>
        </article>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_200px_auto_auto]"
        >
          <Field
            label="Buscar lote o producto"
            htmlFor="batch-search"
          >
            <input
              id="batch-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  search: event.target.value,
                })
              }
              placeholder="Producto, código o lote..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            />
          </Field>

          <Field
            label="Producto"
            htmlFor="batch-product"
          >
            <select
              id="batch-product"
              value={filters.idProducto}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  idProducto: event.target.value,
                })
              }
              disabled={isLoadingProducts}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
            >
              <option value="">
                {isLoadingProducts
                  ? "Cargando productos..."
                  : "Todos los productos"}
              </option>
              {products.map((product) => (
                <option
                  key={product.idProducto}
                  value={product.idProducto}
                >
                  {product.nombre} · {product.codigoBarras}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Estado"
            htmlFor="batch-status"
          >
            <select
              id="batch-status"
              value={filters.estado}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  estado: event.target.value as
                    | BatchStatus
                    | "",
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="PROXIMO_VENCER">
                Próximo a vencer
              </option>
              <option value="VENCIDO">Vencido</option>
              <option value="AGOTADO">Agotado</option>
            </select>
          </Field>

          <div className="flex flex-col justify-end gap-2 pb-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    onlyAvailable: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-400 accent-[#d90016]"
              />
              Solo disponibles
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
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
          </div>

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
          <StateMessage text="Cargando lotes…" />
        ) : filteredBatches.length === 0 ? (
          <StateMessage text="No se encontraron lotes para estos filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                  <th className="px-5 py-3 font-bold">
                    Producto
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Código de lote
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Cantidad inicial
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Disponible
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Vencimiento
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Tiempo restante
                  </th>
                  <th className="px-5 py-3 text-center font-bold">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr
                    key={batch.idLote}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {batch.producto}
                        {!batch.activo && (
                          <span className="ml-2 text-xs font-bold text-slate-700">
                            (Inactivo)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {batch.codigoBarras}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900">
                      {batch.codigoLote}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      {formatNumber(batch.cantidadInicial)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatNumber(batch.cantidadDisponible)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {formatDateOnly(batch.fechaVencimiento)}
                    </td>
                    <td className="px-5 py-4">
                      <DaysBadge days={batch.diasParaVencer} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <BatchStatusBadge
                        status={batch.estado}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredBatches.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-sm font-medium text-slate-700">
            Mostrando {formatNumber(filteredBatches.length)} lote(s)
          </div>
        )}
      </div>
    </section>
  );
}
