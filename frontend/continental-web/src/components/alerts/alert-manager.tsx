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
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import type { SessionUser } from "@/types/auth";
import type {
  Alert,
  AlertActionResponse,
  AlertType,
  AlertsResponse,
  AlertsSummary,
  AlertsSummaryResponse,
} from "@/types/alerts";

type AlertFilters = {
  tipo: AlertType | "";
  leida: "all" | "true" | "false";
  includeInactive: boolean;
  search: string;
};

const initialFilters: AlertFilters = {
  tipo: "",
  leida: "all",
  includeInactive: false,
  search: "",
};

const typeLabels: Record<AlertType, string> = {
  STOCK_MINIMO: "Stock mínimo",
  PROXIMO_VENCIMIENTO: "Próximo vencimiento",
};

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "green" | "slate";
}) {
  const styles = {
    red: "border-l-red-700",
    amber: "border-l-amber-600",
    green: "border-l-green-700",
    slate: "border-l-slate-800",
  };

  return (
    <article
      className={[
        "rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm",
        styles[tone],
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-slate-700">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#24272a]">
        {formatNumber(value)}
      </p>
    </article>
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
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-700">
      {text}
    </div>
  );
}

function AlertTypeBadge({
  type,
}: {
  type: AlertType;
}) {
  const className =
    type === "STOCK_MINIMO"
      ? "bg-amber-100 text-amber-900"
      : "bg-red-100 text-red-900";

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        className,
      ].join(" ")}
    >
      {typeLabels[type]}
    </span>
  );
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value
    .slice(0, 10)
    .split("-");

  return `${day}/${month}/${year}`;
}

export function AlertManager({
  user,
}: {
  user: SessionUser;
}) {
  const router = useRouter();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] =
    useState<AlertsSummary | null>(null);
  const [filters, setFilters] =
    useState<AlertFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] =
    useState(false);
  const [processingAlertId, setProcessingAlertId] =
    useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  async function loadAlerts(
    selectedFilters: AlertFilters
  ) {
    setIsLoading(true);

    const query = new URLSearchParams({
      includeInactive: String(
        selectedFilters.includeInactive
      ),
    });

    if (selectedFilters.tipo) {
      query.set("tipo", selectedFilters.tipo);
    }

    if (selectedFilters.leida !== "all") {
      query.set("leida", selectedFilters.leida);
    }

    try {
      const response = await fetch(
        `/api/alerts?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<AlertsResponse>(
          response,
          "No fue posible consultar las alertas."
        );

      setAlerts(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar las alertas.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSummary() {
    try {
      const response = await fetch(
        "/api/alerts/summary",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<AlertsSummaryResponse>(
          response,
          "No fue posible cargar el resumen de alertas."
        );

      setSummary(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el resumen de alertas.",
        "error"
      );
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAlerts(initialFilters);
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = filters.search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return alerts;
    }

    return alerts.filter((alert) =>
      [
        alert.producto,
        alert.codigoBarras,
        alert.codigoLote ?? "",
        alert.mensaje,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [alerts, filters.search]);

  function showMessage(
    value: string,
    type: "success" | "error"
  ) {
    setMessage(value);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  function handleFilterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void loadAlerts(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    void loadAlerts(initialFilters);
  }

  async function markAsRead(alert: Alert) {
    if (alert.leida) {
      return;
    }

    setProcessingAlertId(alert.idAlerta);

    try {
      const response = await fetch(
        `/api/alerts/${alert.idAlerta}/read`,
        {
          method: "PATCH",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<AlertActionResponse>(
          response,
          "No fue posible marcar la alerta como leída."
        );

      showMessage(
        body.message ??
          "Alerta marcada como leída.",
        "success"
      );
      await Promise.all([
        loadAlerts(filters),
        loadSummary(),
      ]);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible marcar la alerta como leída.",
        "error"
      );
    } finally {
      setProcessingAlertId(null);
    }
  }

  async function generateAlerts() {
    if (user.rol !== "PROPIETARIO") {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "/api/alerts/generate",
        {
          method: "POST",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<AlertActionResponse>(
          response,
          "No fue posible generar las alertas."
        );

      showMessage(
        body.message ??
          "Alertas generadas correctamente.",
        "success"
      );
      await Promise.all([
        loadAlerts(filters),
        loadSummary(),
      ]);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible generar las alertas.",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const summaryCards = summary
    ? [
        {
          label: "Alertas activas",
          value: summary.totalActivas,
          tone: "slate" as const,
        },
        {
          label: "Stock mínimo",
          value: summary.stockMinimo,
          tone: "amber" as const,
        },
        {
          label: "Próximos vencimientos",
          value: summary.proximosVencimientos,
          tone: "red" as const,
        },
        {
          label: "No leídas",
          value: summary.noLeidas,
          tone: "green" as const,
        },
      ]
    : [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
            Continental
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
            Centro de alertas
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Revisa alertas de stock mínimo y vencimiento.
          </p>
        </div>

        {user.rol === "PROPIETARIO" && (
          <button
            type="button"
            onClick={() => void generateAlerts()}
            disabled={isGenerating}
            className="h-11 rounded-xl bg-[#d90016] px-5 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating
              ? "Generando…"
              : "Generar alertas"}
          </button>
        )}
      </div>

      {message && (
        <Message
          text={message}
          type={messageType}
        />
      )}

      {summary && (
        <section
          aria-label="Resumen de alertas"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={card.value}
              tone={card.tone}
            />
          ))}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_220px_200px_auto_auto]"
        >
          <Field
            label="Buscar alerta"
            htmlFor="alert-search"
          >
            <input
              id="alert-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  search: event.target.value,
                })
              }
              placeholder="Producto, lote o mensaje..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            />
          </Field>

          <Field
            label="Tipo"
            htmlFor="alert-type"
          >
            <select
              id="alert-type"
              value={filters.tipo}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  tipo: event.target.value as
                    | AlertType
                    | "",
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            >
              <option value="">Todos los tipos</option>
              <option value="STOCK_MINIMO">
                Stock mínimo
              </option>
              <option value="PROXIMO_VENCIMIENTO">
                Próximo vencimiento
              </option>
            </select>
          </Field>

          <Field
            label="Estado de lectura"
            htmlFor="alert-read-status"
          >
            <select
              id="alert-read-status"
              value={filters.leida}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  leida: event.target.value as
                    | "all"
                    | "true"
                    | "false",
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            >
              <option value="all">Todas</option>
              <option value="false">No leídas</option>
              <option value="true">Leídas</option>
            </select>
          </Field>

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
            Incluir inactivas
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 rounded-xl bg-slate-800 px-4 font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
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
          <StateMessage text="Cargando alertas…" />
        ) : filteredAlerts.length === 0 ? (
          <StateMessage text="No se encontraron alertas para estos filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                  <th className="px-5 py-3 font-bold">Fecha</th>
                  <th className="px-5 py-3 font-bold">Tipo</th>
                  <th className="px-5 py-3 font-bold">Producto</th>
                  <th className="px-5 py-3 font-bold">Detalle</th>
                  <th className="px-5 py-3 font-bold">Alerta</th>
                  <th className="px-5 py-3 text-center font-bold">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.idAlerta}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                      {formatDateTime(alert.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <AlertTypeBadge type={alert.tipo} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {alert.producto}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {alert.codigoBarras}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {alert.tipo === "STOCK_MINIMO" ? (
                        <>
                          Stock:{" "}
                          <span className="font-bold text-slate-900">
                            {formatNumber(alert.stockActual)}
                          </span>
                          {" / Mínimo: "}
                          <span className="font-bold text-slate-900">
                            {formatNumber(alert.stockMinimo)}
                          </span>
                        </>
                      ) : (
                        <>
                          Lote:{" "}
                          <span className="font-bold text-slate-900">
                            {alert.codigoLote ?? "—"}
                          </span>
                          <br />
                          Vence:{" "}
                          <span className="font-bold text-slate-900">
                            {alert.fechaVencimiento
                              ? formatDateOnly(
                                  alert.fechaVencimiento
                                )
                              : "—"}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="max-w-sm px-5 py-4 font-medium text-slate-800">
                      {alert.mensaje}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                            alert.leida
                              ? "bg-slate-200 text-slate-800"
                              : "bg-blue-100 text-blue-900",
                          ].join(" ")}
                        >
                          {alert.leida
                            ? "Leída"
                            : "No leída"}
                        </span>
                        {!alert.activa && (
                          <span className="text-xs font-semibold text-slate-700">
                            Inactiva
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {alert.leida ? (
                        <span className="text-sm font-semibold text-slate-700">
                          Revisada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void markAsRead(alert)
                          }
                          disabled={
                            processingAlertId ===
                            alert.idAlerta
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {processingAlertId ===
                          alert.idAlerta
                            ? "Guardando…"
                            : "Marcar leída"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
