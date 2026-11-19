"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { readApiResponse } from "@/lib/api/read-response";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import type {
  Product,
  ProductsResponse,
} from "@/types/products";
import type {
  Provider,
  ProvidersResponse,
} from "@/types/providers";
import type {
  Purchase,
  PurchaseFormData,
  PurchaseResponse,
  PurchasesResponse,
} from "@/types/purchases";

const initialForm: PurchaseFormData = {
  idProveedor: 0,
  observacion: "",
  detalles: [],
};

function FormField({
  label,
  required = false,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-800"
      >
        {label}
        {required && (
          <span className="ml-1 text-[#d90016]">
            *
          </span>
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
        "mb-6 rounded-xl border px-4 py-3 text-sm font-semibold",
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="mt-6 rounded-2xl bg-slate-50 py-12 text-center text-sm font-semibold text-slate-500">
      Cargando compras…
    </div>
  );
}

function EmptyMessage() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-500">
      No se encontraron compras.
    </div>
  );
}

export function PurchaseManager() {
  const router = useRouter();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] =
    useState<PurchaseFormData>(initialForm);
  const [selectedProductId, setSelectedProductId] =
    useState(0);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] =
    useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<Purchase | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] =
    useState(false);

  async function loadPurchases() {
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/purchases",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<PurchasesResponse>(
          response,
          "No fue posible consultar las compras."
        );

      setPurchases(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar las compras.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOptions() {
    setIsLoadingOptions(true);

    try {
      const [productsResponse, providersResponse] =
        await Promise.all([
          fetch(
            "/api/products?includeInactive=false",
            { cache: "no-store" }
          ),
          fetch(
            "/api/providers?includeInactive=false",
            { cache: "no-store" }
          ),
        ]);

      if (
        productsResponse.status === 401 ||
        providersResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      const [productsBody, providersBody] =
        await Promise.all([
          readApiResponse<ProductsResponse>(
            productsResponse,
            "No fue posible cargar los productos."
          ),
          readApiResponse<ProvidersResponse>(
            providersResponse,
            "No fue posible cargar los proveedores."
          ),
        ]);

      setProducts(
        productsBody.data.filter(
          (product) => product.activo
        )
      );
      setProviders(
        providersBody.data.filter(
          (provider) => provider.activo
        )
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los productos y proveedores.",
        "error"
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPurchases();
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPurchases = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return purchases;
    }

    return purchases.filter((purchase) =>
      [
        String(purchase.idCompra),
        purchase.proveedor,
        purchase.usuario,
        purchase.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [purchases, search]);

  const formTotal = useMemo(
    () =>
      form.detalles.reduce(
        (total, detail) =>
          total +
          Number(detail.cantidad) *
            Number(detail.costoUnitario),
        0
      ),
    [form.detalles]
  );

  const totalPurchases = useMemo(
    () =>
      purchases.reduce(
        (total, purchase) =>
          total + Number(purchase.total),
        0
      ),
    [purchases]
  );

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

  function addDetail() {
    const product = products.find(
      (item) => item.idProducto === selectedProductId
    );

    if (!product) {
      showMessage(
        "Selecciona un producto para agregarlo a la compra.",
        "error"
      );
      return;
    }

    setForm((current) => ({
      ...current,
      detalles: [
        ...current.detalles,
        {
          idProducto: product.idProducto,
          cantidad: 1,
          costoUnitario: product.precioCompra,
          codigoLote: "",
          fechaVencimiento: "",
        },
      ],
    }));
    setSelectedProductId(0);
    setMessage("");
  }

  function updateDetail(
    index: number,
    updates: Partial<PurchaseFormData["detalles"][number]>
  ) {
    setForm((current) => ({
      ...current,
      detalles: current.detalles.map(
        (detail, detailIndex) =>
          detailIndex === index
            ? { ...detail, ...updates }
            : detail
      ),
    }));
  }

  function removeDetail(index: number) {
    setForm((current) => ({
      ...current,
      detalles: current.detalles.filter(
        (_, detailIndex) => detailIndex !== index
      ),
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.idProveedor) {
      showMessage(
        "Selecciona un proveedor para la compra.",
        "error"
      );
      return;
    }

    if (form.detalles.length === 0) {
      showMessage(
        "Agrega al menos un producto a la compra.",
        "error"
      );
      return;
    }

    for (const detail of form.detalles) {
      const product = products.find(
        (item) => item.idProducto === detail.idProducto
      );

      if (
        !Number.isInteger(Number(detail.cantidad)) ||
        Number(detail.cantidad) <= 0
      ) {
        showMessage(
          "Cada producto debe tener una cantidad entera mayor a cero.",
          "error"
        );
        return;
      }

      if (
        !Number.isFinite(Number(detail.costoUnitario)) ||
        Number(detail.costoUnitario) < 0
      ) {
        showMessage(
          "El costo unitario no puede ser negativo.",
          "error"
        );
        return;
      }

      if (
        product?.controlaVencimiento &&
        (!detail.codigoLote.trim() ||
          !detail.fechaVencimiento)
      ) {
        showMessage(
          `Completa lote y vencimiento para ${product.nombre}.`,
          "error"
        );
        return;
      }
    }

    void savePurchase();
  }

  async function savePurchase() {
    setIsSaving(true);

    try {
      const response = await fetch(
        "/api/purchases",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idProveedor: Number(form.idProveedor),
            observacion: form.observacion.trim(),
            detalles: form.detalles.map(
              (detail) => ({
                idProducto: Number(detail.idProducto),
                cantidad: Number(detail.cantidad),
                costoUnitario: Number(
                  detail.costoUnitario
                ),
                codigoLote: detail.codigoLote.trim(),
                fechaVencimiento:
                  detail.fechaVencimiento || "",
              })
            ),
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<PurchaseResponse>(
          response,
          "No fue posible registrar la compra."
        );

      showMessage(
        body.message ??
          "Compra registrada correctamente.",
        "success"
      );
      setForm(initialForm);
      setSelectedProductId(0);
      await loadPurchases();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la compra.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function openPurchaseDetails(
    purchase: Purchase
  ) {
    setSelectedPurchase(purchase);
    setIsLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/purchases/${purchase.idCompra}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<PurchaseResponse>(
          response,
          "No fue posible consultar el detalle de la compra."
        );

      setSelectedPurchase(body.data);
    } catch (error) {
      setSelectedPurchase(null);
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar el detalle de la compra.",
        "error"
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const selectedProduct = products.find(
    (product) =>
      product.idProducto === selectedProductId
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
            Continental
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
            Órdenes de compra
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Registra compras a proveedores y consulta su historial.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Compras registradas
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {formatNumber(purchases.length)}
            <span className="mx-2 text-slate-300">·</span>
            {formatCurrency(totalPurchases)}
          </p>
        </div>
      </div>

      {message && (
        <Message
          text={message}
          type={messageType}
        />
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-800">
            Registrar compra
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Agrega los productos recibidos y sus costos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Proveedor"
              htmlFor="purchase-provider"
              required
            >
              <select
                id="purchase-provider"
                required
                value={form.idProveedor}
                onChange={(event) =>
                  setForm({
                    ...form,
                    idProveedor: Number(event.target.value),
                  })
                }
                disabled={
                  isLoadingOptions || isSaving
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
              >
                <option value={0}>
                  {isLoadingOptions
                    ? "Cargando proveedores..."
                    : "Selecciona un proveedor"}
                </option>
                {providers.map((provider) => (
                  <option
                    key={provider.idProveedor}
                    value={provider.idProveedor}
                  >
                    {provider.razonSocial} · {provider.documento}
                  </option>
                ))}
              </select>
              {!isLoadingOptions &&
                providers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    No hay proveedores activos disponibles.
                  </p>
                )}
            </FormField>

            <FormField
              label="Observación"
              htmlFor="purchase-observation"
            >
              <input
                id="purchase-observation"
                type="text"
                value={form.observacion}
                onChange={(event) =>
                  setForm({
                    ...form,
                    observacion: event.target.value,
                  })
                }
                placeholder="Nota opcional de la compra"
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
              />
            </FormField>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <FormField
                label="Producto"
                htmlFor="purchase-product"
              >
                <select
                  id="purchase-product"
                  value={selectedProductId}
                  onChange={(event) =>
                    setSelectedProductId(
                      Number(event.target.value)
                    )
                  }
                  disabled={
                    isLoadingOptions ||
                    isSaving ||
                    products.length === 0
                  }
                  className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 sm:min-w-[280px]"
                >
                  <option value={0}>
                    {isLoadingOptions
                      ? "Cargando productos..."
                      : "Selecciona un producto"}
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
              </FormField>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addDetail}
                  disabled={
                    isSaving ||
                    isLoadingOptions ||
                    !selectedProduct
                  }
                  className="h-12 w-full rounded-xl bg-slate-800 px-5 font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Agregar producto
                </button>
              </div>
            </div>
            {!isLoadingOptions &&
              products.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  No hay productos activos disponibles.
                </p>
              )}
          </div>

          {form.detalles.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                    <th className="px-4 py-3 font-bold">
                      Producto
                    </th>
                    <th className="px-4 py-3 font-bold">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 font-bold">
                      Costo unitario
                    </th>
                    <th className="px-4 py-3 font-bold">
                      Lote
                    </th>
                    <th className="px-4 py-3 font-bold">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {form.detalles.map((detail, index) => {
                    const product = products.find(
                      (item) =>
                        item.idProducto === detail.idProducto
                    );

                    return (
                      <tr
                        key={`${detail.idProducto}-${index}`}
                        className="border-b border-slate-200 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {product?.nombre ??
                              `Producto ${detail.idProducto}`}
                          </p>
                          <p className="text-xs text-slate-700">
                            {product?.codigoBarras}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={detail.cantidad}
                            onChange={(event) =>
                              updateDetail(index, {
                                cantidad:
                                  Number(event.target.value),
                              })
                            }
                            disabled={isSaving}
                            aria-label={`Cantidad de ${product?.nombre ?? "producto"}`}
                            className="w-24 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={detail.costoUnitario}
                            onChange={(event) =>
                              updateDetail(index, {
                                costoUnitario:
                                  Number(event.target.value),
                              })
                            }
                            disabled={isSaving}
                            aria-label={`Costo unitario de ${product?.nombre ?? "producto"}`}
                            className="w-32 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={detail.codigoLote}
                            onChange={(event) =>
                              updateDetail(index, {
                                codigoLote:
                                  event.target.value,
                              })
                            }
                            disabled={isSaving}
                            required={
                              product?.controlaVencimiento
                            }
                            aria-label={`Lote de ${product?.nombre ?? "producto"}`}
                            placeholder="Opcional"
                            className="w-32 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-600 focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {product?.controlaVencimiento ? (
                            <input
                              type="date"
                              value={detail.fechaVencimiento}
                              onChange={(event) =>
                                updateDetail(index, {
                                  fechaVencimiento:
                                    event.target.value,
                                })
                              }
                              disabled={isSaving}
                              required
                              aria-label={`Fecha de vencimiento de ${product.nombre}`}
                              className="rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-700">
                              No aplica
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(
                            Number(detail.cantidad) *
                              Number(detail.costoUnitario)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              removeDetail(index)
                            }
                            disabled={isSaving}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label={`Quitar ${product?.nombre ?? "producto"}`}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Agrega al menos un producto para calcular el total.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              Total de la compra
              <span className="ml-3 text-xl font-bold text-slate-900">
                {formatCurrency(formTotal)}
              </span>
            </p>
            <button
              type="submit"
              disabled={
                isSaving ||
                isLoadingOptions ||
                form.detalles.length === 0
              }
              className="h-11 rounded-xl bg-[#d90016] px-5 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Registrando…"
                : "Registrar compra"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-800">
              Historial de compras
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Consulta compras registradas y sus detalles.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            Buscar
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Proveedor, usuario o número..."
              className="w-72 max-w-full rounded-xl border border-slate-300 bg-white px-4 py-2 font-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
            />
          </label>
        </div>

        {isLoading ? (
          <LoadingMessage />
        ) : filteredPurchases.length === 0 ? (
          <EmptyMessage />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-bold">
                    Compra
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Fecha
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Proveedor
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Usuario
                  </th>
                  <th className="px-5 py-3 text-center font-bold">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Total
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.idCompra}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      #{purchase.idCompra}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateTime(purchase.fecha)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {purchase.proveedor}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {purchase.usuario}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                        {purchase.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                      {formatCurrency(purchase.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          void openPurchaseDetails(purchase)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-detail-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#d90016]">
                  Detalle de compra
                </p>
                <h3
                  id="purchase-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Compra #{selectedPurchase.idCompra}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            {isLoadingDetails ? (
              <LoadingMessage />
            ) : (
              <>
                <dl className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Proveedor
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedPurchase.proveedor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Fecha
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {formatDateTime(selectedPurchase.fecha)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Usuario
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedPurchase.usuario}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">
                      Estado
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedPurchase.estado}
                    </dd>
                  </div>
                  {selectedPurchase.observacion && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-bold uppercase text-slate-500">
                        Observación
                      </dt>
                      <dd className="mt-1 text-slate-700">
                        {selectedPurchase.observacion}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[560px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                        <th className="px-4 py-3 font-bold">
                          Producto
                        </th>
                        <th className="px-4 py-3 font-bold">
                          Código
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Costo unitario
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase.detalles.map(
                        (detail) => (
                          <tr
                            key={detail.idCompraDetalle}
                            className="border-b border-slate-200 last:border-0 text-slate-900"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {detail.producto}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-slate-800">
                              {detail.codigoBarras}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatNumber(detail.cantidad)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(
                                detail.costoUnitario
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatCurrency(detail.subtotal)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                  <p className="text-sm font-semibold text-slate-600">
                    Total
                    <span className="ml-3 text-xl font-bold text-slate-900">
                      {formatCurrency(selectedPurchase.total)}
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
