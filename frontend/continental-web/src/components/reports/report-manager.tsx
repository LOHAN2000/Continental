"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { readApiResponse } from "@/lib/api/read-response";
import {
  formatCurrency,
  formatNumber,
} from "@/lib/formatters";
import type {
  BalanceResponse,
  FinancialBalance,
  TopProductsResponse,
  TopSellingProduct,
} from "@/types/reports";

function getMonthStart() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

function getToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 border-l-4 border-l-[#d90016] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#24272a]">
        {value}
      </p>
    </article>
  );
}

function Message({
  text,
  type,
}: {
  text: string;
  type: "success" | "error";
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "rounded-xl border px-4 py-3 text-sm font-semibold",
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-900",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function StateMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm font-semibold text-slate-700">
      {text}
    </div>
  );
}

export function ReportManager() {
  const router = useRouter();

  const [fechaInicio, setFechaInicio] =
    useState(getMonthStart);
  const [fechaFin, setFechaFin] =
    useState(getToday);
  const [balance, setBalance] =
    useState<FinancialBalance | null>(null);
  const [topProducts, setTopProducts] =
    useState<TopSellingProduct[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");
  const [isLoading, setIsLoading] =
    useState(false);

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  async function loadReports(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    if (!fechaInicio || !fechaFin) {
      showMessage(
        "Selecciona las fechas de inicio y fin.",
        "error"
      );
      return;
    }

    if (fechaInicio > fechaFin) {
      showMessage(
        "La fecha inicial no puede ser posterior a la fecha final.",
        "error"
      );
      return;
    }

    setIsLoading(true);
    setMessage("");

    const query = new URLSearchParams({
      fechaInicio,
      fechaFin,
    });
    const topProductsQuery = new URLSearchParams(
      query
    );
    topProductsQuery.set("limit", "10");

    try {
      const [
        balanceResponse,
        topProductsResponse,
      ] = await Promise.all([
        fetch(
          `/api/reports/balance?${query.toString()}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/reports/top-products?${topProductsQuery.toString()}`,
          { cache: "no-store" }
        ),
      ]);

      if (
        balanceResponse.status === 401 ||
        topProductsResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      const balanceBody =
        await readApiResponse<BalanceResponse>(
          balanceResponse,
          "No fue posible consultar el balance."
        );
      const topProductsBody =
        await readApiResponse<TopProductsResponse>(
          topProductsResponse,
          "No fue posible consultar los productos más vendidos."
        );

      setBalance(balanceBody.data);
      setTopProducts(topProductsBody.data);
    } catch (error) {
      setBalance(null);
      setTopProducts([]);
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los reportes.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const summaryCards = balance
    ? [
        {
          label: "Ventas realizadas",
          value: formatNumber(balance.cantidadVentas),
        },
        {
          label: "Ingresos por ventas",
          value: formatCurrency(
            balance.ingresosPorVentas
          ),
        },
        {
          label: "Costo histórico vendido",
          value: formatCurrency(
            balance.costoHistoricoVendido
          ),
        },
        {
          label: "Margen bruto estimado",
          value: formatCurrency(
            balance.margenBrutoEstimado
          ),
        },
        {
          label: "Porcentaje de margen bruto",
          value: `${formatNumber(balance.porcentajeMargenBruto)}%`,
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
          Reportes y balance financiero
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Consulta el balance financiero y los productos más vendidos por período.
        </p>
      </div>

      {message && (
        <Message
          text={message}
          type={messageType}
        />
      )}

      <form
        onSubmit={(event) => void loadReports(event)}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="report-start-date"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Fecha de inicio
          </label>
          <input
            id="report-start-date"
            type="date"
            required
            value={fechaInicio}
            onChange={(event) =>
              setFechaInicio(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
          />
        </div>
        <div>
          <label
            htmlFor="report-end-date"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Fecha de fin
          </label>
          <input
            id="report-end-date"
            type="date"
            required
            value={fechaFin}
            onChange={(event) =>
              setFechaFin(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-xl bg-[#d90016] px-5 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Consultando…" : "Consultar reportes"}
        </button>
      </form>

      {isLoading ? (
        <StateMessage text="Cargando reportes…" />
      ) : balance ? (
        <>
          <section
            aria-label="Resumen financiero"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
              />
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Balance por producto
            </h3>
            {balance.productos.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="px-4 py-3 font-bold">Producto</th>
                      <th className="px-4 py-3 text-right font-bold">Cantidad vendida</th>
                      <th className="px-4 py-3 text-right font-bold">Ingresos</th>
                      <th className="px-4 py-3 text-right font-bold">Costo histórico</th>
                      <th className="px-4 py-3 text-right font-bold">Margen bruto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.productos.map((product) => (
                      <tr
                        key={product.idProducto}
                        className="border-t border-slate-200 text-slate-800"
                      >
                        <td className="px-4 py-3 font-semibold">{product.producto}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(product.cantidadVendida)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(product.ingresos)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(product.costoHistorico)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(product.margenBrutoEstimado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <StateMessage text="No hay ventas por producto en este período." />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Productos más vendidos
            </h3>
            {topProducts.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="px-4 py-3 font-bold">Producto</th>
                      <th className="px-4 py-3 font-bold">Código de barras</th>
                      <th className="px-4 py-3 text-right font-bold">Cantidad vendida</th>
                      <th className="px-4 py-3 text-right font-bold">Importe vendido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product) => (
                      <tr
                        key={product.idProducto}
                        className="border-t border-slate-200 text-slate-800"
                      >
                        <td className="px-4 py-3 font-semibold">{product.producto}</td>
                        <td className="px-4 py-3">{product.codigoBarras}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(product.cantidadVendida)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(product.importeVendido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <StateMessage text="No hay productos vendidos en este período." />
              </div>
            )}
          </section>
        </>
      ) : (
        <StateMessage text="Selecciona un período y consulta los reportes." />
      )}
    </section>
  );
}
