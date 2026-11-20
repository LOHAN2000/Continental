"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { readApiResponse } from "@/lib/api/read-response";
import {
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import type {
  Product,
  ProductsResponse,
} from "@/types/products";
import type {
  Adjustment,
  AdjustmentResponse,
  AdjustmentType,
  AdjustmentsResponse,
  CreateAdjustmentData,
} from "@/types/adjustments";

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
        {required && (
          <span className="ml-1 text-[#d90016]">*</span>
        )}
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

function AdjustmentBadge({
  type,
}: {
  type: Adjustment["tipo"];
}) {
  const isEntry = type === "AJUSTE_ENTRADA";

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        isEntry
          ? "bg-green-50 text-green-800"
          : "bg-red-50 text-red-800",
      ].join(" ")}
    >
      {isEntry ? "Entrada" : "Salida"}
    </span>
  );
}

export function AdjustmentManager() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] =
    useState<Adjustment[]>([]);
  const [idProducto, setIdProducto] = useState(0);
  const [tipo, setTipo] =
    useState<AdjustmentType>("ENTRADA");
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [filterProductId, setFilterProductId] =
    useState(0);
  const [isLoadingProducts, setIsLoadingProducts] =
    useState(true);
  const [isLoadingAdjustments, setIsLoadingAdjustments] =
    useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  async function loadProducts() {
    setIsLoadingProducts(true);

    try {
      const response = await fetch(
        "/api/products?includeInactive=false",
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
          "No fue posible consultar los productos."
        );

      setProducts(
        body.data.filter((product) => product.activo)
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los productos.",
        "error"
      );
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function loadAdjustments(
    productId = filterProductId
  ) {
    setIsLoadingAdjustments(true);

    const query = new URLSearchParams({
      limit: "50",
    });

    if (productId) {
      query.set("idProducto", String(productId));
    }

    try {
      const response = await fetch(
        `/api/adjustments?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<AdjustmentsResponse>(
          response,
          "No fue posible consultar los ajustes."
        );

      setAdjustments(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los ajustes.",
        "error"
      );
    } finally {
      setIsLoadingAdjustments(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
    void loadAdjustments(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const selectedProduct = products.find(
    (product) => product.idProducto === idProducto
  );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedProduct) {
      showMessage(
        "Selecciona un producto para el ajuste.",
        "error"
      );
      return;
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      showMessage(
        "La cantidad debe ser un entero mayor a cero.",
        "error"
      );
      return;
    }

    if (!motivo.trim()) {
      showMessage(
        "El motivo del ajuste es obligatorio.",
        "error"
      );
      return;
    }

    void saveAdjustment();
  }

  async function saveAdjustment() {
    setIsSaving(true);

    try {
      const payload: CreateAdjustmentData = {
        idProducto,
        tipo,
        cantidad,
        motivo: motivo.trim(),
      };

      const response = await fetch(
        "/api/adjustments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<AdjustmentResponse>(
          response,
          "No fue posible registrar el ajuste."
        );

      setMotivo("");
      setCantidad(1);
      showMessage(
        body.message ??
          "Ajuste registrado correctamente.",
        "success"
      );
      await Promise.all([
        loadProducts(),
        loadAdjustments(filterProductId),
      ]);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el ajuste.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
          Continental
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
          Ajustes de inventario
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Registra entradas o salidas manuales para corregir existencias.
        </p>
      </div>

      {message && (
        <Message
          text={message}
          type={messageType}
        />
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">
          Registrar ajuste
        </h3>
        <p className="mt-1 text-sm text-slate-700">
          El servidor rechazará las salidas superiores al stock disponible.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <Field
            label="Producto"
            htmlFor="adjustment-product"
            required
          >
            <select
              id="adjustment-product"
              required
              value={idProducto}
              onChange={(event) =>
                setIdProducto(Number(event.target.value))
              }
              disabled={
                isLoadingProducts || isSaving
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
            >
              <option value={0}>
                {isLoadingProducts
                  ? "Cargando productos..."
                  : "Selecciona un producto"}
              </option>
              {products.map((product) => (
                <option
                  key={product.idProducto}
                  value={product.idProducto}
                >
                  {product.nombre} · Stock:{" "}
                  {formatNumber(product.stockActual)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Tipo de ajuste"
            htmlFor="adjustment-type"
            required
          >
            <select
              id="adjustment-type"
              value={tipo}
              onChange={(event) =>
                setTipo(
                  event.target.value as AdjustmentType
                )
              }
              disabled={isSaving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
            >
              <option value="ENTRADA">
                Entrada de stock
              </option>
              <option value="SALIDA">
                Salida de stock
              </option>
            </select>
          </Field>

          <Field
            label="Cantidad"
            htmlFor="adjustment-quantity"
            required
          >
            <input
              id="adjustment-quantity"
              type="number"
              min="1"
              step="1"
              required
              value={cantidad}
              onChange={(event) =>
                setCantidad(Number(event.target.value))
              }
              disabled={isSaving}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
            />
          </Field>

          <div className="flex items-end rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800">
            Stock actual:
            <span className="ml-2 font-bold text-slate-900">
              {selectedProduct
                ? formatNumber(selectedProduct.stockActual)
                : "—"}
            </span>
          </div>

          <div className="md:col-span-2">
            <Field
              label="Motivo"
              htmlFor="adjustment-reason"
              required
            >
              <textarea
                id="adjustment-reason"
                rows={3}
                required
                value={motivo}
                onChange={(event) =>
                  setMotivo(event.target.value)
                }
                disabled={isSaving}
                placeholder="Describe la razón del ajuste"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
              />
            </Field>
          </div>

          <div className="flex justify-end md:col-span-2">
            <button
              type="submit"
              disabled={
                isSaving ||
                isLoadingProducts ||
                products.length === 0
              }
              className="h-11 rounded-xl bg-[#d90016] px-5 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Registrando…"
                : "Registrar ajuste"}
            </button>
          </div>
        </form>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">
              Historial de ajustes
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              Últimos 50 movimientos manuales.
            </p>
          </div>
          <Field
            label="Filtrar por producto"
            htmlFor="adjustment-filter-product"
          >
            <div className="flex gap-2">
              <select
                id="adjustment-filter-product"
                value={filterProductId}
                onChange={(event) =>
                  setFilterProductId(
                    Number(event.target.value)
                  )
                }
                className="w-64 max-w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
              >
                <option value={0}>Todos los productos</option>
                {products.map((product) => (
                  <option
                    key={product.idProducto}
                    value={product.idProducto}
                  >
                    {product.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  void loadAdjustments(filterProductId)
                }
                disabled={isLoadingAdjustments}
                className="h-10 rounded-xl bg-slate-800 px-4 font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                Filtrar
              </button>
            </div>
          </Field>
        </div>

        {isLoadingAdjustments ? (
          <StateMessage text="Cargando ajustes…" />
        ) : adjustments.length === 0 ? (
          <StateMessage text="No hay ajustes registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                  <th className="px-5 py-3 font-bold">Fecha</th>
                  <th className="px-5 py-3 font-bold">Producto</th>
                  <th className="px-5 py-3 font-bold">Tipo</th>
                  <th className="px-5 py-3 text-right font-bold">
                    Cantidad
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Stock anterior
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Stock actual
                  </th>
                  <th className="px-5 py-3 font-bold">Usuario</th>
                  <th className="px-5 py-3 font-bold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adjustment) => (
                  <tr
                    key={adjustment.idMovimiento}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                      {formatDateTime(adjustment.fecha)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {adjustment.producto}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {adjustment.codigoBarras}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <AdjustmentBadge
                        type={adjustment.tipo}
                      />
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatNumber(adjustment.cantidad)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      {formatNumber(adjustment.stockAnterior)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatNumber(adjustment.stockActual)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {adjustment.usuario}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {adjustment.motivo}
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
