"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { readApiResponse } from "@/lib/api/read-response";
import type {
  Product,
  ProductFormData,
  ProductResponse,
  ProductsResponse,
  ProductStockStatus,
} from "@/types/products";

const initialForm: ProductFormData = {
  idCategoria: 0,
  codigoBarras: "",
  nombre: "",
  descripcion: "",
  precioCompra: 0,
  precioVenta: 0,
  stockMinimo: 0,
  controlaVencimiento: false,
};

function MessageBanner({
  text,
  type,
}: {
  text: string;
  type: "success" | "error";
}) {
  return (
    <div
      role="alert"
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

function ProductStatus({
  product,
}: {
  product: Product;
}) {
  if (!product.activo) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        Inactivo
      </span>
    );
  }

  const styles = {
    DISPONIBLE: "bg-green-50 text-green-800",
    STOCK_MINIMO: "bg-amber-50 text-amber-800",
    SIN_STOCK: "bg-red-50 text-red-800",
  };

  const labels = {
    DISPONIBLE: "Disponible",
    STOCK_MINIMO: "Stock mínimo",
    SIN_STOCK: "Sin stock",
  };

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-bold",
        styles[product.estadoStock as ProductStockStatus],
      ].join(" ")}
    >
      {labels[product.estadoStock as ProductStockStatus]}
    </span>
  );
}

function LoadingMessage() {
  return (
    <div className="mt-6 rounded-2xl bg-slate-50 py-12 text-center text-sm font-semibold text-slate-500">
      Cargando productos…
    </div>
  );
}

function EmptyMessage() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm font-semibold text-slate-500">
      No se encontraron productos.
    </div>
  );
}

export function ProductManager({
  user,
}: {
  user: {
    rol: "PROPIETARIO" | "CAJERO";
  };
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    { idCategoria: number; nombre: string }[]
  >([]);

  const [form, setForm] = useState({
    idCategoria: 0,
    codigoBarras: "",
    nombre: "",
    descripcion: "",
    precioCompra: 0,
    precioVenta: 0,
    stockMinimo: 0,
    controlaVencimiento: false,
  });

  const [editingProduct, setEditingProduct] = useState<
    Product | null
  >(null);

  const [search, setSearch] = useState("");
  const [idCategoriaFilter, setIdCategoriaFilter] = useState(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadProducts() {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (idCategoriaFilter) {
        params.set("idCategoria", String(idCategoriaFilter));
      }
      params.set("includeInactive", "true");

      const response = await fetch(
        `/api/products?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const body =
        await readApiResponse<ProductsResponse>(
          response,
          "No fue posible cargar los productos."
        );

      setProducts(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los productos.",
        "error"
      );
    } finally {
      setIsLoading(false);
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

      if (response.ok) {
        const body = (await response.json()) as {
          data: { idCategoria: number; nombre: string }[];
        };
        setCategories(body.data);
      }
    } catch {
      // Ignorar error de categorías
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
    void loadCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch && !idCategoriaFilter) {
      return products;
    }

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.nombre.toLowerCase().includes(normalizedSearch) ||
        product.codigoBarras.toLowerCase().includes(normalizedSearch) ||
        product.categoria.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        !idCategoriaFilter ||
        product.idCategoria === idCategoriaFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, idCategoriaFilter]);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nombre.trim()) {
      showMessage(
        "El nombre del producto es obligatorio.",
        "error"
      );
      return;
    }

    if (form.precioVenta < 0) {
      showMessage(
        "El precio de venta no puede ser negativo.",
        "error"
      );
      return;
    }

    if (form.precioCompra < 0) {
      showMessage(
        "El precio de compra no puede ser negativo.",
        "error"
      );
      return;
    }

    if (form.stockMinimo < 0) {
      showMessage(
        "El stock mínimo no puede ser negativo.",
        "error"
      );
      return;
    }

    void saveProduct();
  }

  async function saveProduct() {
    setIsSaving(true);

    try {
      if (editingProduct) {
        const response = await fetch(
          `/api/products/${editingProduct.idProducto}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              idCategoria: form.idCategoria,
              codigoBarras: form.codigoBarras.trim(),
              nombre: form.nombre.trim(),
              descripcion: form.descripcion.trim() || null,
              precioCompra: Number(form.precioCompra),
              precioVenta: Number(form.precioVenta),
              stockMinimo: Number(form.stockMinimo),
              controlaVencimiento: form.controlaVencimiento,
            }),
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        await readApiResponse<ProductResponse>(
          response,
          "No fue posible actualizar el producto."
        );

        showMessage(
          "Producto actualizado correctamente.",
          "success"
        );
      } else {
        const response = await fetch(
          "/api/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              idCategoria: form.idCategoria,
              codigoBarras: form.codigoBarras.trim(),
              nombre: form.nombre.trim(),
              descripcion: form.descripcion.trim() || null,
              precioCompra: Number(form.precioCompra),
              precioVenta: Number(form.precioVenta),
              stockMinimo: Number(form.stockMinimo),
              controlaVencimiento: form.controlaVencimiento,
            }),
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        await readApiResponse<ProductResponse>(
          response,
          "No fue posible crear el producto."
        );

        showMessage(
          "Producto registrado correctamente.",
          "success"
        );
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el producto.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      idCategoria: product.idCategoria,
      codigoBarras: product.codigoBarras,
      nombre: product.nombre,
      descripcion: product.descripcion ?? "",
      precioCompra: product.precioCompra,
      precioVenta: product.precioVenta,
      stockMinimo: product.stockMinimo,
      controlaVencimiento: product.controlaVencimiento,
    });
  }

  async function handleToggleActive(product: Product) {
    try {
      const response = await fetch(
        `/api/products/${product.idProducto}/estado?activo=${!product.activo}`,
        {
          method: "PATCH",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      await readApiResponse<unknown>(
        response,
        "No fue posible cambiar el estado."
      );

      showMessage(
        product.activo
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente.",
        "success"
      );

      await loadProducts();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado.",
        "error"
      );
    }
  }

  function resetForm() {
    setForm({
      idCategoria: 0,
      codigoBarras: "",
      nombre: "",
      descripcion: "",
      precioCompra: 0,
      precioVenta: 0,
      stockMinimo: 0,
      controlaVencimiento: false,
    });
    setEditingProduct(null);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function formatNumber(value: number): string {
    return new Intl.NumberFormat("es-PE", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
            Continental
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
            Catálogo de productos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({
              idCategoria: 0,
              codigoBarras: "",
              nombre: "",
              descripcion: "",
              precioCompra: 0,
              precioVenta: 0,
              stockMinimo: 0,
              controlaVencimiento: false,
            });
            setEditingProduct(null);
          }}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 5v14M5 12h14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Nuevo producto</span>
        </button>
      </div>

      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={[
            "mb-6 rounded-xl border px-4 py-3 text-sm font-semibold",
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="lg:col-span-2">
              <label
                htmlFor="nombre"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Nombre <span className="text-red-500">*</span>
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={form.nombre}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nombre: event.target.value,
                  })
                }
                placeholder="Nombre del producto"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="codigoBarras"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Código de barras
              </label>

              <input
                id="codigoBarras"
                name="codigoBarras"
                type="text"
                value={form.codigoBarras}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codigoBarras: event.target.value,
                  })
                }
                placeholder="Código de barras"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="idCategoria"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Categoría <span className="text-red-500">*</span>
              </label>

              <select
                id="idCategoria"
                required
                value={form.idCategoria}
                onChange={(event) =>
                  setForm({
                    ...form,
                    idCategoria: Number(event.target.value),
                  })
                }
                disabled={isSaving}
                className="input-style"
              >
                <option value={0}>Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="precioCompra"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Precio de compra (PEN)
              </label>

              <input
                id="precioCompra"
                type="number"
                step="0.01"
                min="0"
                value={form.precioCompra}
                onChange={(event) =>
                  setForm({
                    ...form,
                    precioCompra: Number(event.target.value) || 0,
                  })
                }
                placeholder="0.00"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="precioVenta"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Precio de venta (PEN) <span className="text-red-500">*</span>
              </label>

              <input
                id="precioVenta"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.precioVenta}
                onChange={(event) =>
                  setForm({
                    ...form,
                    precioVenta: Number(event.target.value) || 0,
                  })
                }
                placeholder="0.00"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="stockMinimo"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Stock mínimo
              </label>

              <input
                id="stockMinimo"
                type="number"
                step="0.01"
                min="0"
                value={form.stockMinimo}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stockMinimo: Number(event.target.value) || 0,
                  })
                }
                placeholder="0"
                disabled={isSaving}
                className="input-style"
              />
            </div>

            <div>
              <label
                htmlFor="controlaVencimiento"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Controla vencimiento
              </label>

              <select
                id="controlaVencimiento"
                value={String(form.controlaVencimiento)}
                onChange={(event) =>
                  setForm({
                    ...form,
                    controlaVencimiento: event.target.value === "true",
                  })
                }
                disabled={isSaving}
                className="input-style"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="descripcion"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Descripción
              </label>

              <textarea
                id="descripcion"
                rows={3}
                value={form.descripcion}
                onChange={(event) =>
                  setForm({
                    ...form,
                    descripcion: event.target.value,
                  })
                }
                placeholder="Descripción opcional..."
                disabled={isSaving}
                className="input-style"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    idCategoria: 0,
                    codigoBarras: "",
                    nombre: "",
                    descripcion: "",
                    precioCompra: 0,
                    precioVenta: 0,
                    stockMinimo: 0,
                    controlaVencimiento: false,
                  });
                  setEditingProduct(null);
                }}
                disabled={isSaving}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#d90016] px-4 font-bold text-white transition hover:bg-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Guardando…"
                : editingProduct
                ? "Actualizar producto"
                : "Registrar producto"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5 lg:py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label
                htmlFor="search"
                className="shrink-0 text-sm font-semibold text-slate-800"
              >
                Buscar
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Nombre, código o categoría..."
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 sm:w-72"
              />
            </div>

            <select
              value={idCategoriaFilter}
              onChange={(event) =>
                setIdCategoriaFilter(Number(event.target.value))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-[#d90016] focus:ring-4 focus:ring-red-100 lg:w-48"
            >
              <option value={0}>Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 px-5 font-bold">
                  Código
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Producto
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Categoría
                </th>
                <th className="py-2.5 px-5 font-bold text-right">
                  P. Compra
                </th>
                <th className="py-2.5 px-5 font-bold text-right">
                  P. Venta
                </th>
                <th className="py-2.5 px-5 font-bold text-right">
                  Stock
                </th>
                <th className="py-2.5 px-5 font-bold text-right">
                  Mínimo
                </th>
                <th className="py-2.5 px-5 font-bold text-center">
                  Estado
                </th>
                <th className="py-2.5 px-5 font-bold text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    {search
                      ? "No se encontraron productos."
                      : "No existen productos registrados."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.idProducto}
                    className="border-b border-slate-100"
                  >
                    <td className="py-4 px-5 font-mono text-sm text-slate-600">
                      {product.codigoBarras}
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-800">
                        {product.nombre}
                      </p>
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      {product.categoria}
                    </td>

                    <td className="py-4 px-5 text-right">
                      {formatCurrency(product.precioCompra)}
                    </td>

                    <td className="py-4 px-5 text-right font-semibold">
                      {formatCurrency(product.precioVenta)}
                    </td>

                    <td className="py-4 px-5 text-right font-bold">
                      {formatNumber(product.stockActual)}
                    </td>

                    <td className="py-4 px-5 text-right">
                      {formatNumber(product.stockMinimo)}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <ProductStatus product={product} />
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          disabled={isSaving}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Editar producto"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-5 w-5"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 013 3z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          disabled={isSaving}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-2 transition focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={
                            product.activo
                              ? "Desactivar producto"
                              : "Activar producto"
                          }
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            className={[
                              "h-5 w-5",
                              product.activo
                                ? "text-green-600"
                                : "text-red-600",
                            ].join(" ")}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {product.activo ? (
                              <>
                                <path
                                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M12 16V12M12 8H12.01"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            ) : (
                              <>
                                <path
                                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M8 12H16"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d90016] border-t-transparent" />
          </div>
        )}
      </div>
    </section>
  );
}