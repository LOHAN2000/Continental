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
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/formatters";
import type { SessionUser } from "@/types/auth";
import type {
  Product,
  ProductsResponse,
} from "@/types/products";
import type {
  CreateSaleData,
  Sale,
  SaleCartItem,
  SaleResponse,
  SalesResponse,
} from "@/types/sales";

function TotalCard({
  label,
  value,
  green = false,
}: {
  label: string;
  value: number;
  green?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl px-5 py-4",
        green
          ? "bg-green-50"
          : "bg-[#fff4cc]",
      ].join(" ")}
    >
      <p
        className={[
          "text-sm font-semibold",
          green
            ? "text-green-800"
            : "text-[#6b4e00]",
        ].join(" ")}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[#24272a]">
        {formatCurrency(value)}
      </p>
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
          : "border-red-200 bg-red-50 text-red-800",
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
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-600">
      {text}
    </div>
  );
}

export function SalesManager({
  user,
}: {
  user: SessionUser;
}) {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleCartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [productSearch, setProductSearch] =
    useState("");
  const [observacion, setObservacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");
  const [isLoadingProducts, setIsLoadingProducts] =
    useState(true);
  const [isLoadingSales, setIsLoadingSales] =
    useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSale, setSelectedSale] =
    useState<Sale | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] =
    useState(false);

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

  async function loadSales(
    startDate = "",
    endDate = ""
  ) {
    setIsLoadingSales(true);

    const query = new URLSearchParams();
    if (startDate) {
      query.set("fechaInicio", startDate);
    }
    if (endDate) {
      query.set("fechaFin", endDate);
    }

    const queryString = query.toString();

    try {
      const response = await fetch(
        `/api/sales${queryString ? `?${queryString}` : ""}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<SalesResponse>(
          response,
          "No fue posible consultar las ventas."
        );

      setSales(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar las ventas.",
        "error"
      );
    } finally {
      setIsLoadingSales(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
    void loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter(
      (product) =>
        product.nombre
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.codigoBarras
          .toLowerCase()
          .includes(normalizedSearch)
    );
  }, [products, productSearch]);

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.precioUnitario * item.cantidad,
        0
      ),
    [cart]
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

  function addToCart(product: Product) {
    if (product.stockActual <= 0) {
      showMessage(
        "No hay stock disponible para este producto.",
        "error"
      );
      return;
    }

    const existing = cart.find(
      (item) =>
        item.idProducto === product.idProducto
    );

    if (existing) {
      if (
        existing.cantidad >= existing.stockDisponible
      ) {
        showMessage(
          `No hay más stock disponible de ${product.nombre}.`,
          "error"
        );
        return;
      }

      setCart(
        cart.map((item) =>
          item.idProducto === product.idProducto
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          idProducto: product.idProducto,
          codigoBarras: product.codigoBarras,
          nombre: product.nombre,
          precioUnitario: product.precioVenta,
          stockDisponible: product.stockActual,
          cantidad: 1,
        },
      ]);
    }

    setMessage("");
  }

  function updateCartQuantity(
    idProducto: number,
    quantity: number
  ) {
    const item = cart.find(
      (cartItem) =>
        cartItem.idProducto === idProducto
    );

    if (!item) {
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > item.stockDisponible
    ) {
      showMessage(
        `La cantidad debe estar entre 1 y ${item.stockDisponible}.`,
        "error"
      );
      return;
    }

    setCart((current) =>
      current.map((cartItem) =>
        cartItem.idProducto === idProducto
          ? { ...cartItem, cantidad: quantity }
          : cartItem
      )
    );
    setMessage("");
  }

  function removeFromCart(idProducto: number) {
    setCart((current) =>
      current.filter(
        (item) => item.idProducto !== idProducto
      )
    );
  }

  function handleSalesFilterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      fechaInicio &&
      fechaFin &&
      fechaInicio > fechaFin
    ) {
      showMessage(
        "La fecha de inicio no puede ser posterior a la fecha final.",
        "error"
      );
      return;
    }

    void loadSales(fechaInicio, fechaFin);
  }

  async function submitSale() {
    if (cart.length === 0) {
      showMessage(
        "Agrega al menos un producto al carrito.",
        "error"
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload: CreateSaleData = {
        observacion: observacion.trim(),
        detalles: cart.map((item) => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
        })),
      };

      const response = await fetch(
        "/api/sales",
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
        await readApiResponse<SaleResponse>(
          response,
          "No fue posible registrar la venta."
        );

      setCart([]);
      setObservacion("");
      showMessage(
        body.message ??
          `Venta #${body.data.idVenta} registrada correctamente.`,
        "success"
      );
      await Promise.all([
        loadProducts(),
        loadSales(fechaInicio, fechaFin),
      ]);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la venta.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function openSaleDetails(sale: Sale) {
    setSelectedSale(sale);
    setIsLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/sales/${sale.idVenta}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body =
        await readApiResponse<SaleResponse>(
          response,
          "No fue posible consultar el detalle de la venta."
        );

      setSelectedSale(body.data);
    } catch (error) {
      setSelectedSale(null);
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible consultar el detalle de la venta.",
        "error"
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const estimatedCost = useMemo(
    () =>
      cart.reduce((total, item) => {
        const product = products.find(
          (entry) =>
            entry.idProducto === item.idProducto
        );
        return (
          total +
          Number(product?.precioCompra ?? 0) *
            item.cantidad
        );
      }, 0),
    [cart, products]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
            Continental
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
            Punto de venta
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Vendedor:{" "}
            <span className="font-semibold text-slate-900">
              {user.nombres}
            </span>
          </p>
        </div>
        <TotalCard
          label="Total de la venta"
          value={cartTotal}
          green
        />
      </div>

      {message && (
        <Message
          text={message}
          type={messageType}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Productos
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                Busca por nombre o código de barras.
              </p>
            </div>
            <label className="text-sm font-semibold text-slate-800">
              <span className="sr-only">
                Buscar producto
              </span>
              <input
                type="search"
                value={productSearch}
                onChange={(event) =>
                  setProductSearch(event.target.value)
                }
                placeholder="Buscar producto..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-normal text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 sm:w-72"
              />
            </label>
          </div>

          {isLoadingProducts ? (
            <StateMessage text="Cargando productos…" />
          ) : filteredProducts.length === 0 ? (
            <StateMessage text="No hay productos disponibles para esa búsqueda." />
          ) : (
            <div className="mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {filteredProducts.map((product) => (
                <article
                  key={product.idProducto}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="min-w-[180px] flex-1">
                    <h4 className="font-bold text-slate-900">
                      {product.nombre}
                    </h4>
                    <p className="mt-1 font-mono text-xs text-slate-700">
                      {product.codigoBarras}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatCurrency(product.precioVenta)}
                      <span className="mx-2 text-slate-500">·</span>
                      Stock: {formatNumber(product.stockActual)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={
                      isSaving || product.stockActual <= 0
                    }
                    className="h-10 rounded-xl bg-[#d90016] px-4 font-bold text-white transition hover:bg-[#a90012] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {product.stockActual > 0
                      ? "Agregar"
                      : "Sin stock"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Carrito
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {formatNumber(cart.length)}{" "}
                {cart.length === 1
                  ? "producto"
                  : "productos"}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                disabled={isSaving}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
              >
                Vaciar
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <StateMessage text="Agrega productos para iniciar una venta." />
          ) : (
            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <article
                  key={item.idProducto}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900">
                        {item.nombre}
                      </h4>
                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {item.codigoBarras}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(item.idProducto)
                      }
                      disabled={isSaving}
                      className="rounded-md px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <label
                        htmlFor={`sale-quantity-${item.idProducto}`}
                        className="mb-1 block text-xs font-bold text-slate-800"
                      >
                        Cantidad (máx. {item.stockDisponible})
                      </label>
                      <input
                        id={`sale-quantity-${item.idProducto}`}
                        type="number"
                        min="1"
                        max={item.stockDisponible}
                        step="1"
                        value={item.cantidad}
                        onChange={(event) =>
                          updateCartQuantity(
                            item.idProducto,
                            Number(event.target.value)
                          )
                        }
                        disabled={isSaving}
                        className="w-24 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">
                        {formatCurrency(item.precioUnitario)} c/u
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatCurrency(
                          item.precioUnitario * item.cantidad
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <label
            htmlFor="sale-observation"
            className="mt-5 block text-sm font-semibold text-slate-800"
          >
            Observación (opcional)
          </label>
          <textarea
            id="sale-observation"
            rows={2}
            value={observacion}
            onChange={(event) =>
              setObservacion(event.target.value)
            }
            disabled={isSaving}
            placeholder="Nota de la venta"
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
          />

          {cart.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm text-slate-800">
                <span>Costo estimado</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(estimatedCost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => void submitSale()}
                disabled={isSaving || cart.length === 0}
                className="h-12 w-full rounded-xl bg-green-700 px-5 font-bold text-white transition hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Procesando venta…"
                  : "Registrar venta"}
              </button>
            </div>
          )}
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Historial de ventas
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              Filtra las ventas por fecha y consulta su detalle.
            </p>
          </div>

          <form
            onSubmit={handleSalesFilterSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label
                htmlFor="sales-start-date"
                className="mb-1 block text-xs font-bold text-slate-800"
              >
                Desde
              </label>
              <input
                id="sales-start-date"
                type="date"
                value={fechaInicio}
                onChange={(event) =>
                  setFechaInicio(event.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label
                htmlFor="sales-end-date"
                className="mb-1 block text-xs font-bold text-slate-800"
              >
                Hasta
              </label>
              <input
                id="sales-end-date"
                type="date"
                value={fechaFin}
                onChange={(event) =>
                  setFechaFin(event.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#d90016] focus:ring-2 focus:ring-red-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingSales}
              className="h-10 rounded-xl bg-slate-800 px-4 font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              Filtrar
            </button>
          </form>
        </div>

        {isLoadingSales ? (
          <StateMessage text="Cargando ventas…" />
        ) : sales.length === 0 ? (
          <StateMessage text="No se encontraron ventas en este período." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                  <th className="px-5 py-3 font-bold">
                    Venta
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Fecha
                  </th>
                  <th className="px-5 py-3 font-bold">
                    Usuario
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Total
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Costo histórico
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Margen
                  </th>
                  <th className="px-5 py-3 text-center font-bold">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.idVenta}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900">
                      #{sale.idVenta}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {formatDateTime(sale.fecha)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {sale.usuario}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">
                      {formatCurrency(sale.costoHistoricoTotal)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-green-800">
                      {formatCurrency(
                        sale.margenBrutoEstimado
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                        {sale.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          void openSaleDetails(sale)
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100"
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
      </section>

      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-detail-title"
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#d90016]">
                  Detalle de venta
                </p>
                <h3
                  id="sale-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Venta #{selectedSale.idVenta}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            {isLoadingDetails ? (
              <StateMessage text="Cargando detalle de venta…" />
            ) : (
              <>
                <dl className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-700">
                      Fecha
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(selectedSale.fecha)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-700">
                      Usuario
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {selectedSale.usuario}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-700">
                      Estado
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {selectedSale.estado}
                    </dd>
                  </div>
                  {selectedSale.observacion && (
                    <div>
                      <dt className="text-xs font-bold uppercase text-slate-700">
                        Observación
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {selectedSale.observacion}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[880px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                        <th className="px-4 py-3 font-bold">
                          Producto
                        </th>
                        <th className="px-4 py-3 font-bold">
                          Código / lote
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Precio unitario
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Costo histórico
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Subtotal
                        </th>
                        <th className="px-4 py-3 text-right font-bold">
                          Margen
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.detalles.map(
                        (detail) => (
                          <tr
                            key={detail.idVentaDetalle}
                            className="border-b border-slate-200 last:border-0 text-slate-900"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {detail.producto}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              <span className="block font-mono">
                                {detail.codigoBarras}
                              </span>
                              <span className="mt-1 block text-slate-700">
                                Lote: {detail.codigoLote ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatNumber(detail.cantidad)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(
                                detail.precioUnitario
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                              {formatCurrency(
                                detail.costoHistoricoUnitario
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatCurrency(detail.subtotal)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-800">
                              {formatCurrency(
                                detail.margenBrutoEstimado
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">
                      Total
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(selectedSale.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">
                      Costo histórico
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(
                        selectedSale.costoHistoricoTotal
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-800">
                      Margen estimado
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {formatCurrency(
                        selectedSale.margenBrutoEstimado
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
