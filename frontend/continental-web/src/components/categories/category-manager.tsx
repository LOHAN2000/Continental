"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CategoriesResponse,
  Category,
  CategoryErrorResponse,
  CategoryFormData,
  CategoryResponse,
} from "@/types/categories";

const initialForm: CategoryFormData = {
  nombre: "",
  descripcion: "",
};

export function CategoryManager() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [form, setForm] =
    useState<CategoryFormData>(initialForm);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [search, setSearch] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success"
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  async function loadCategories() {
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/categories?includeInactive=true",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const body =
        (await response.json()) as CategoriesResponse;

      if (!response.ok) {
        throw new Error(
          "No fue posible cargar las categorías."
        );
      }

      setCategories(body.data);
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las categorías.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const filteredCategories =
    useMemo(() => {
      const normalizedSearch = search
        .trim()
        .toLowerCase();

      if (!normalizedSearch) {
        return categories;
      }

      return categories.filter(
        (category) =>
          category.nombre
            .toLowerCase()
            .includes(normalizedSearch) ||
          category.descripcion
            ?.toLowerCase()
            .includes(normalizedSearch)
      );
    }, [categories, search]);

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
        "El nombre de la categoría es obligatorio.",
        "error"
      );
      return;
    }

    void saveCategory();
  }

  async function saveCategory() {
    setIsSaving(true);

    try {
      if (editingCategory) {
        const response = await fetch(
          `/api/categories/${editingCategory.idCategoria}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: form.nombre.trim(),
              descripcion: form.descripcion.trim() || null,
            }),
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const body =
          (await response.json()) as
            | CategoryResponse
            | CategoryErrorResponse;

        if (!response.ok) {
          throw new Error(
            body.message ??
              "No fue posible actualizar la categoría."
          );
        }

        showMessage(
          body.message ??
            "Categoría actualizada correctamente.",
          "success"
        );
      } else {
        const response = await fetch(
          "/api/categories",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: form.nombre.trim(),
              descripcion: form.descripcion.trim() || null,
            }),
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const body =
          (await response.json()) as
            | CategoryResponse
            | CategoryErrorResponse;

        if (!response.ok) {
          throw new Error(
            body.message ??
              "No fue posible crear la categoría."
          );
        }

        showMessage(
          body.message ??
            "Categoría registrada correctamente.",
          "success"
        );
      }

      setForm(initialForm);
      setEditingCategory(null);
      await loadCategories();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la categoría.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setForm({
      nombre: category.nombre,
      descripcion: category.descripcion ?? "",
    });
  }

  async function handleToggleActive(
    category: Category
  ) {
    try {
      const response = await fetch(
        `/api/categories/${category.idCategoria}/estado?activo=${!category.activo}`,
        {
          method: "PATCH",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const body =
          (await response.json()) as CategoryErrorResponse;
        throw new Error(
          body.message ??
            "No fue posible cambiar el estado."
        );
      }

      showMessage(
        category.activo
          ? "Categoría desactivada correctamente."
          : "Categoría activada correctamente.",
        "success"
      );

      await loadCategories();
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado.",
        "error"
      );
    }
  }

  function handleCancel() {
    setForm(initialForm);
    setEditingCategory(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#d90016]">
            Continental
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#24272a]">
            Gestión de categorías
          </h2>
        </div>

        <button
          type="button"
          onClick={handleCancel}
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
          <span>Nueva categoría</span>
        </button>
      </div>

      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={[
            "rounded-2xl px-4 py-3 text-sm font-medium",
            messageType === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800",
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
                placeholder="Ej. Abarrotes, Lácteos, Bebidas..."
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
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
                name="descripcion"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {editingCategory && (
              <button
                type="button"
                onClick={handleCancel}
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
                : editingCategory
                ? "Actualizar categoría"
                : "Registrar categoría"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label
                htmlFor="search"
                className="text-sm font-semibold text-slate-800"
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
                placeholder="Nombre o descripción..."
                className="w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#d90016] focus:ring-4 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 px-5 font-bold">
                  Nombre
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Descripción
                </th>
                <th className="py-2.5 px-5 font-bold">
                  Estado
                </th>
                <th className="py-2.5 px-5 text-right font-bold">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    {search
                      ? "No se encontraron categorías."
                      : "No existen categorías registradas."}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.idCategoria}
                    className="border-b border-slate-100"
                  >
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-800">
                        {category.nombre}
                      </p>
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      {category.descripcion ?? "—"}
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                          category.activo
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800",
                        ].join(" ")}
                      >
                        {category.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                          disabled={isSaving}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-[#a90012] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Editar categoría"
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
                          onClick={() => handleToggleActive(category)}
                          disabled={isSaving}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-2 transition focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={
                            category.activo
                              ? "Desactivar categoría"
                              : "Activar categoría"
                          }
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            className={
                              [
                                "h-5 w-5",
                                category.activo
                                  ? "text-green-600"
                                  : "text-red-600",
                              ].join(" ")
                            }
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {category.activo ? (
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